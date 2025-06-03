import Garnish from './Garnish';
import Base from './Base';
import $ from 'jquery';
import {
  ElementOrJQuery,
  JQueryElement,
  SelectInterface,
  SelectSettings,
} from './types';

/**
 * Select
 */
export default Base.extend<SelectInterface>(
  {
    $container: null as JQueryElement | null,
    $items: null as JQueryElement | null,
    $selectedItems: null as JQueryElement | null,
    $focusedItem: null as JQueryElement | null,

    mousedownTarget: null as HTMLElement | null,
    mouseUpTimeout: null as number | null,
    callbackFrame: null as number | null,

    $focusable: null as JQueryElement | null,
    $first: null as JQueryElement | null,
    first: null as number | null,
    $last: null as JQueryElement | null,
    last: null as number | null,

    /**
     * Constructor
     */
    init: function (
      container?: ElementOrJQuery,
      items?: ElementOrJQuery,
      settings?: SelectSettings
    ): void {
      this.$container = $(container as any);

      // Param mapping
      if (typeof items === 'undefined' && $.isPlainObject(container)) {
        // (settings)
        settings = container as SelectSettings;
        container = null;
        items = null;
      } else if (typeof settings === 'undefined' && $.isPlainObject(items)) {
        // (container, settings)
        settings = items as SelectSettings;
        items = null;
      }

      // Is this already a select?
      const existingSelect = this.$container.data('select') as SelectInterface;
      if (existingSelect) {
        console.warn('Double-instantiating a select on an element');
        existingSelect.destroy();
      }

      this.$container.data('select', this);

      this.setSettings(settings, Garnish.Select.defaults);

      this.$items = $();
      this.$selectedItems = $();

      this.addItems(items);

      // --------------------------------------------------------------------

      if (this.settings.allowEmpty && !this.settings.checkboxMode) {
        this.addListener(
          this.$container,
          'click',
          function (this: SelectInterface) {
            if ((this as any).ignoreClick) {
              (this as any).ignoreClick = false;
            } else {
              // Deselect all items on container click
              this.deselectAll(true);
            }
          }
        );
      }
    },

    /**
     * Get Item Index
     */
    getItemIndex: function ($item: JQueryElement): number {
      return this.$items!.index($item[0]);
    },

    /**
     * Is Selected?
     */
    isSelected: function (item: ElementOrJQuery): boolean {
      if (Garnish.isJquery(item)) {
        if (!(item as JQueryElement)[0]) {
          return false;
        }

        item = (item as JQueryElement)[0];
      }

      return $.inArray(item, this.$selectedItems!) !== -1;
    },

    /**
     * Select Item
     */
    selectItem: function (
      $item: JQueryElement,
      focus?: boolean,
      preventScroll?: boolean
    ): void {
      if (!this.settings.multi) {
        this.deselectAll();
      }

      this.$first = this.$last = $item;
      this.first = this.last = this.getItemIndex($item);

      if (focus) {
        this.focusItem($item, preventScroll);
      }

      this._selectItems($item);
    },

    selectAll: function (): void {
      if (!this.settings.multi || !this.$items!.length) {
        return;
      }

      this.first = 0;
      this.last = this.$items!.length - 1;
      this.$first = this.$items!.eq(this.first);
      this.$last = this.$items!.eq(this.last);

      this._selectItems(this.$items!);
    },

    /**
     * Select Range
     */
    selectRange: function (
      $item: JQueryElement,
      preventScroll?: boolean
    ): void {
      if (!this.settings.multi) {
        return this.selectItem($item, true, true);
      }

      this.deselectAll();

      this.$last = $item;
      this.last = this.getItemIndex($item);

      this.focusItem($item, preventScroll);

      // prepare params for $.slice()
      let sliceFrom: number, sliceTo: number;

      if (this.first! < this.last!) {
        sliceFrom = this.first!;
        sliceTo = this.last! + 1;
      } else {
        sliceFrom = this.last!;
        sliceTo = this.first! + 1;
      }

      this._selectItems(this.$items!.slice(sliceFrom, sliceTo));
    },

    /**
     * Deselect Item
     */
    deselectItem: function ($item: JQueryElement): void {
      const index = this.getItemIndex($item);
      if (this.first === index) {
        this.$first = this.first = null;
      }
      if (this.last === index) {
        this.$last = this.last = null;
      }

      this._deselectItems($item);
    },

    /**
     * Deselect All
     */
    deselectAll: function (clearFirst?: boolean): void {
      if (clearFirst) {
        this.$first = this.first = this.$last = this.last = null;
      }

      this._deselectItems(this.$items!);
    },

    /**
     * Deselect Others
     */
    deselectOthers: function ($item: JQueryElement): void {
      this.deselectAll();
      this.selectItem($item, true, true);
    },

    /**
     * Toggle Item
     */
    toggleItem: function ($item: JQueryElement, preventScroll?: boolean): void {
      if (!this.isSelected($item)) {
        this.selectItem($item, true, preventScroll);
      } else {
        if (this._canDeselect($item)) {
          this.deselectItem($item);
        }
      }
    },

    clearMouseUpTimeout: function (): void {
      if (this.mouseUpTimeout) {
        clearTimeout(this.mouseUpTimeout);
      }
    },

    getFirstItem: function (): JQueryElement | undefined {
      if (this.$items!.length) {
        return this.$items!.first();
      }
    },

    getLastItem: function (): JQueryElement | undefined {
      if (this.$items!.length) {
        return this.$items!.last();
      }
    },

    isPreviousItem: function (index: number): boolean {
      return index > 0;
    },

    isNextItem: function (index: number): boolean {
      return index < this.$items!.length - 1;
    },

    getPreviousItem: function (index: number): JQueryElement | undefined {
      if (this.isPreviousItem(index)) {
        return this.$items!.eq(index - 1);
      }
    },

    getNextItem: function (index: number): JQueryElement | undefined {
      if (this.isNextItem(index)) {
        return this.$items!.eq(index + 1);
      }
    },

    getItemToTheLeft: function (index: number): JQueryElement | undefined {
      const func = Garnish.ltr ? 'Previous' : 'Next';

      if ((this as any)['is' + func + 'Item'](index)) {
        if (this.settings.horizontal) {
          return (this as any)['get' + func + 'Item'](index);
        }
        if (!this.settings.vertical) {
          return this.getClosestItem(index, Garnish.X_AXIS, '<');
        }
      }
    },

    getItemToTheRight: function (index: number): JQueryElement | undefined {
      const func = Garnish.ltr ? 'Next' : 'Previous';

      if ((this as any)['is' + func + 'Item'](index)) {
        if (this.settings.horizontal) {
          return (this as any)['get' + func + 'Item'](index);
        } else if (!this.settings.vertical) {
          return this.getClosestItem(index, Garnish.X_AXIS, '>');
        }
      }
    },

    getItemAbove: function (index: number): JQueryElement | undefined {
      if (this.isPreviousItem(index)) {
        if (this.settings.vertical) {
          return this.getPreviousItem(index);
        } else if (!this.settings.horizontal) {
          return this.getClosestItem(index, Garnish.Y_AXIS, '<');
        }
      }
    },

    getItemBelow: function (index: number): JQueryElement | undefined {
      if (this.isNextItem(index)) {
        if (this.settings.vertical) {
          return this.getNextItem(index);
        } else if (!this.settings.horizontal) {
          return this.getClosestItem(index, Garnish.Y_AXIS, '>');
        }
      }
    },

    getClosestItem: function (
      index: number,
      axis: string,
      dir: string
    ): JQueryElement | null {
      const axisProps = (Garnish.Select as any).closestItemAxisProps[axis];
      const dirProps = (Garnish.Select as any).closestItemDirectionProps[dir];

      const $thisItem = this.$items!.eq(index);
      const thisOffset = $thisItem.offset()!;
      const thisMidpoint =
        thisOffset[axisProps.midpointOffset] +
        Math.round($thisItem[axisProps.midpointSizeFunc]() / 2);
      let otherRowPos: number | null = null;
      let smallestMidpointDiff: number | null = null;
      let $closestItem: JQueryElement | null = null;

      // Go the other way if this is the X axis and a RTL page
      let step: number;

      if (Garnish.rtl && axis === Garnish.X_AXIS) {
        step = dirProps.step * -1;
      } else {
        step = dirProps.step;
      }

      for (
        let i = index + step;
        typeof this.$items![i] !== 'undefined';
        i += step
      ) {
        const $otherItem = this.$items!.eq(i);
        const otherOffset = $otherItem.offset()!;

        // Are we on the next row yet?
        if (
          dirProps.isNextRow(
            otherOffset[axisProps.rowOffset],
            thisOffset[axisProps.rowOffset]
          )
        ) {
          // Is this the first time we've seen this row?
          if (otherRowPos === null) {
            otherRowPos = otherOffset[axisProps.rowOffset];
          }
          // Have we gone too far?
          else if (otherOffset[axisProps.rowOffset] !== otherRowPos) {
            break;
          }

          const otherMidpoint =
            otherOffset[axisProps.midpointOffset] +
            Math.round($otherItem[axisProps.midpointSizeFunc]() / 2);
          const midpointDiff = Math.abs(thisMidpoint - otherMidpoint);

          // Are we getting warmer?
          if (
            smallestMidpointDiff === null ||
            midpointDiff < smallestMidpointDiff
          ) {
            smallestMidpointDiff = midpointDiff;
            $closestItem = $otherItem;
          }
          // Getting colder?
          else {
            break;
          }
        }
        // Getting colder?
        else if (
          dirProps.isWrongDirection(
            otherOffset[axisProps.rowOffset],
            thisOffset[axisProps.rowOffset]
          )
        ) {
          break;
        }
      }

      return $closestItem;
    },

    getFurthestItemToTheLeft: function (
      index: number
    ): JQueryElement | undefined {
      return this.getFurthestItem(index, 'ToTheLeft');
    },

    getFurthestItemToTheRight: function (
      index: number
    ): JQueryElement | undefined {
      return this.getFurthestItem(index, 'ToTheRight');
    },

    getFurthestItemAbove: function (index: number): JQueryElement | undefined {
      return this.getFurthestItem(index, 'Above');
    },

    getFurthestItemBelow: function (index: number): JQueryElement | undefined {
      return this.getFurthestItem(index, 'Below');
    },

    getFurthestItem: function (
      index: number,
      dir: string
    ): JQueryElement | undefined {
      let $item: JQueryElement | undefined;
      let $testItem: JQueryElement | undefined;

      while (($testItem = (this as any)['getItem' + dir](index))) {
        $item = $testItem;
        index = this.getItemIndex($item);
      }

      return $item;
    },

    /**
     * totalSelected getter
     */
    get totalSelected(): number {
      return this.getTotalSelected();
    },

    /**
     * Get Total Selected
     */
    getTotalSelected: function (): number {
      return this.$selectedItems!.length;
    },

    /**
     * Add Items
     */
    addItems: function (items: ElementOrJQuery): void {
      const $items = $(items as any);

      for (let i = 0; i < $items.length; i++) {
        const item = $items[i];

        // Make sure this element doesn't belong to another selector
        const existingSelect = $.data(item, 'select') as SelectInterface;
        if (existingSelect) {
          console.warn('Element was added to more than one selector');
          existingSelect.removeItems(item);
        }

        // Add the item
        $.data(item, 'select', this);

        // Get the handle
        let $handle: JQueryElement;

        if (this.settings.handle) {
          if (typeof this.settings.handle === 'object') {
            $handle = $(this.settings.handle as any);
          } else if (typeof this.settings.handle === 'string') {
            $handle = $(item).find(this.settings.handle);
          } else if (typeof this.settings.handle === 'function') {
            $handle = $(this.settings.handle(item));
          } else {
            $handle = $(item);
          }
        } else {
          $handle = $(item);
        }

        $.data(item, 'select-handle', $handle);
        $handle.data('select-item', item);

        // Get the checkbox element
        let $checkbox: JQueryElement | undefined;
        if ((this.settings as any).checkboxClass) {
          $checkbox = $(item).find(`.${(this.settings as any).checkboxClass}`);
        }

        this.addListener($handle, 'mousedown', 'onMouseDown');
        this.addListener($handle, 'mouseup', 'onMouseUp');
        this.addListener($handle, 'click', function (this: SelectInterface) {
          (this as any).ignoreClick = true;
        });

        if ($checkbox && $checkbox.length) {
          $checkbox.data('select-item', item);
          this.addListener(
            $checkbox,
            'keydown',
            (event: JQuery.KeyDownEvent) => {
              if (
                (event.keyCode === Garnish.RETURN_KEY ||
                  event.keyCode === Garnish.SPACE_KEY) &&
                !event.shiftKey &&
                !Garnish.isCtrlKeyPressed(event)
              ) {
                event.preventDefault();
                this.onCheckboxActivate(event);
              }
            }
          );
        }

        this.addListener(item, 'keydown', 'onKeyDown');
      }

      this.$items = this.$items!.add($items);
      this.updateIndexes();
    },

    /**
     * Remove Items
     */
    removeItems: function (items: ElementOrJQuery): void {
      const itemsArray = $.makeArray(items);

      let itemsChanged = false;
      let selectionChanged = false;

      for (let i = 0; i < itemsArray.length; i++) {
        const item = itemsArray[i];

        // Make sure we actually know about this item
        const index = $.inArray(item, this.$items!);
        if (index !== -1) {
          this._deinitItem(item);
          (this.$items as any).splice(index, 1);
          itemsChanged = true;

          const selectedIndex = $.inArray(item, this.$selectedItems!);
          if (selectedIndex !== -1) {
            (this.$selectedItems as any).splice(selectedIndex, 1);
            selectionChanged = true;
          }
        }
      }

      if (itemsChanged) {
        this.updateIndexes();

        if (selectionChanged) {
          $(itemsArray).removeClass((this.settings as any).selectedClass);
          this.onSelectionChange();
        }
      }
    },

    /**
     * Remove All Items
     */
    removeAllItems: function (): void {
      for (let i = 0; i < this.$items!.length; i++) {
        this._deinitItem(this.$items![i]);
      }

      this.$items = $();
      this.$selectedItems = $();
      this.updateIndexes();
    },

    /**
     * Update First/Last indexes
     */
    updateIndexes: function (): void {
      if (this.first !== null) {
        this.first = this.getItemIndex(this.$first!);
        this.setFocusableItem(this.$first!);
      } else if (this.$items!.length) {
        this.setFocusableItem($(this.$items![0]));
      }

      if (this.$focusedItem) {
        this.focusItem(this.$focusedItem, true);
      }

      if (this.last !== null) {
        this.last = this.getItemIndex(this.$last!);
      }
    },

    /**
     * Reset Item Order
     */
    resetItemOrder: function (): void {
      this.$items = $().add(this.$items!);
      this.$selectedItems = $().add(this.$selectedItems!);
      this.updateIndexes();
    },

    /**
     * Sets the focusable item.
     *
     * We only want to have one focusable item per selection list, so that the user
     * doesn't have to tab through a million items.
     */
    setFocusableItem: function ($item: JQueryElement): void {
      if (this.settings.makeFocusable) {
        if (this.$focusable) {
          this.$focusable.removeAttr('tabindex');
        }

        this.$focusable = $item.attr('tabindex', '0');
      }
    },

    /**
     * Sets the focus on an item.
     */
    focusItem: function ($item: JQueryElement, preventScroll?: boolean): void {
      if (this.settings.makeFocusable) {
        this.setFocusableItem($item);
        ($item[0] as HTMLElement).focus({preventScroll: !!preventScroll});
      }
      this.$focusedItem = $item;
      this.trigger('focusItem', {item: $item});
    },

    /**
     * Get Selected Items
     */
    getSelectedItems: function (): JQueryElement {
      return $(this.$selectedItems!.toArray());
    },

    /**
     * Get Focused Item
     */
    getFocusedItem: function (): JQueryElement | null {
      return this.$focusedItem;
    },

    /**
     * Destroy
     */
    destroy: function (): void {
      this.$container!.removeData('select');
      this.removeAllItems();
      this.base();
    },

    // Events
    // ---------------------------------------------------------------------

    /**
     * On Mouse Down
     */
    onMouseDown: function (ev: JQuery.MouseDownEvent): void {
      this.mousedownTarget = null;

      // ignore right/ctrl-clicks
      if (!Garnish.isPrimaryClick(ev) && !Garnish.isCtrlKeyPressed(ev)) {
        return;
      }

      // Enforce the filter
      if (this.settings.filter) {
        if (typeof this.settings.filter === 'function') {
          if (!this.settings.filter(ev.target as HTMLElement)) {
            return;
          }
        } else if (!$(ev.target).is(this.settings.filter)) {
          return;
        }
      }

      const $item = $($.data(ev.currentTarget, 'select-item'));

      if (this.first !== null && ev.shiftKey) {
        // Shift key is consistent for both selection modes
        this.selectRange($item, true);
      } else if (
        this._actAsCheckbox(ev) &&
        (!this.settings.waitForDoubleClicks || !this.isSelected($item))
      ) {
        // Checkbox-style deselection is handled from onMouseUp()
        this.toggleItem($item, true);
      } else {
        // Prepare for click handling in onMouseUp()
        this.mousedownTarget = ev.currentTarget as HTMLElement;
      }
    },

    /**
     * On Mouse Up
     */
    onMouseUp: function (ev: JQuery.MouseUpEvent): void {
      // ignore right clicks
      if (!Garnish.isPrimaryClick(ev) && !Garnish.isCtrlKeyPressed(ev)) {
        return;
      }

      // Enforce the filter
      if (this.settings.filter && !$(ev.target).is(this.settings.filter)) {
        return;
      }

      const $item = $($.data(ev.currentTarget, 'select-item'));

      // was this a click?
      if (!ev.shiftKey && ev.currentTarget === this.mousedownTarget) {
        if (this.isSelected($item)) {
          const handler = () => {
            if (this._actAsCheckbox(ev)) {
              this.deselectItem($item);
            } else {
              this.deselectOthers($item);
            }
          };

          if (this.settings.waitForDoubleClicks) {
            // wait a moment to see if this is a double click before making any rash decisions
            this.clearMouseUpTimeout();
            this.mouseUpTimeout = window.setTimeout(handler, 300);
          } else {
            handler();
          }
        } else if (!this._actAsCheckbox(ev)) {
          // Checkbox-style selection is handled from onMouseDown()
          this.deselectAll();
          this.selectItem($item, true, true);
        }
      }
    },

    onCheckboxActivate: function (ev: JQuery.KeyDownEvent): void {
      ev.stopImmediatePropagation();
      const $item = $($.data(ev.currentTarget, 'select-item'));

      if (!this.isSelected($item)) {
        this.selectItem($item);
      } else {
        this.deselectItem($item);
      }
    },

    /**
     * On Key Down
     */
    onKeyDown: function (ev: JQuery.KeyDownEvent): void {
      // Ignore if the focus isn't on one of our items or their handles
      if (
        ev.target !== ev.currentTarget &&
        !$.data(ev.currentTarget, 'select-handle')?.filter(ev.target).length
      ) {
        return;
      }

      const ctrlKey = Garnish.isCtrlKeyPressed(ev);
      const shiftKey = ev.shiftKey;

      let anchor: number | undefined;
      let $item: JQueryElement | undefined;

      if (!this.settings.checkboxMode || !this.$focusable?.length) {
        anchor = ev.shiftKey ? this.last : this.first;
      } else {
        anchor = $.inArray(this.$focusable[0], this.$items!);

        if (anchor === -1) {
          anchor = 0;
        }
      }

      // Ok, what are we doing here?
      switch (ev.keyCode) {
        case Garnish.LEFT_KEY: {
          ev.preventDefault();

          // Select the last item if none are selected
          if (this.first === null) {
            if (Garnish.ltr) {
              $item = this.getLastItem();
            } else {
              $item = this.getFirstItem();
            }
          } else {
            if (ctrlKey) {
              $item = this.getFurthestItemToTheLeft(anchor!);
            } else {
              $item = this.getItemToTheLeft(anchor!);
            }
          }

          break;
        }

        case Garnish.RIGHT_KEY: {
          ev.preventDefault();

          // Select the first item if none are selected
          if (this.first === null) {
            if (Garnish.ltr) {
              $item = this.getFirstItem();
            } else {
              $item = this.getLastItem();
            }
          } else {
            if (ctrlKey) {
              $item = this.getFurthestItemToTheRight(anchor!);
            } else {
              $item = this.getItemToTheRight(anchor!);
            }
          }

          break;
        }

        case Garnish.UP_KEY: {
          ev.preventDefault();

          // Select the last item if none are selected
          if (this.first === null) {
            if (this.$focusable) {
              $item = this.$focusable.prev();
            }

            if (!this.$focusable || !$item?.length) {
              $item = this.getLastItem();
            }
          } else {
            if (ctrlKey) {
              $item = this.getFurthestItemAbove(anchor!);
            } else {
              $item = this.getItemAbove(anchor!);
            }

            if (!$item) {
              $item = this.getFirstItem();
            }
          }

          break;
        }

        case Garnish.DOWN_KEY: {
          ev.preventDefault();

          // Select the first item if none are selected
          if (this.first === null) {
            if (this.$focusable) {
              $item = this.$focusable.next();
            }

            if (!this.$focusable || !$item?.length) {
              $item = this.getFirstItem();
            }
          } else {
            if (ctrlKey) {
              $item = this.getFurthestItemBelow(anchor!);
            } else {
              $item = this.getItemBelow(anchor!);
            }

            if (!$item) {
              $item = this.getLastItem();
            }
          }

          break;
        }

        case Garnish.SPACE_KEY: {
          if (!ctrlKey && !shiftKey) {
            ev.preventDefault();

            if (this.isSelected(this.$focusable!)) {
              if (this._canDeselect(this.$focusable!)) {
                this.deselectItem(this.$focusable!);
              }
            } else {
              this.selectItem(this.$focusable!, true, false);
            }
          }

          break;
        }

        case Garnish.A_KEY: {
          if (ctrlKey) {
            ev.preventDefault();
            this.selectAll();
          }

          break;
        }
      }

      // Is there an item queued up for focus/selection?
      if ($item && $item.length) {
        if (!this.settings.checkboxMode) {
          // select it
          if (this.first !== null && ev.shiftKey) {
            this.selectRange($item, false);
          } else {
            this.deselectAll();
            this.selectItem($item, true, false);
          }
        } else {
          // just set the new item to be focusable
          this.setFocusableItem($item);
          if (this.settings.makeFocusable) {
            ($item[0] as HTMLElement).focus();
          }
          this.$focusedItem = $item;
          this.trigger('focusItem', {item: $item});
        }
      }
    },

    /**
     * Set Callback Timeout
     */
    onSelectionChange: function (): void {
      if (this.callbackFrame) {
        Garnish.cancelAnimationFrame(this.callbackFrame);
        this.callbackFrame = null;
      }

      this.callbackFrame = Garnish.requestAnimationFrame(
        function (this: SelectInterface) {
          this.callbackFrame = null;
          this.trigger('selectionChange');
          this.settings.onSelectionChange();
        }.bind(this)
      );
    },

    // Private methods
    // ---------------------------------------------------------------------

    _actAsCheckbox: function (ev: JQuery.Event): boolean {
      if (Garnish.isCtrlKeyPressed(ev)) {
        return !this.settings.checkboxMode;
      } else {
        return this.settings.checkboxMode;
      }
    },

    _canDeselect: function ($items: JQueryElement): boolean {
      return this.settings.allowEmpty || this.totalSelected > $items.length;
    },

    _selectItems: function ($items: JQueryElement): void {
      $items.addClass((this.settings as any).selectedClass);

      if ((this.settings as any).checkboxClass) {
        const $checkboxes = $items.find(
          `.${(this.settings as any).checkboxClass}`
        );
        $checkboxes.attr('aria-checked', 'true');
      }

      this.$selectedItems = this.$selectedItems!.add($items);
      this.onSelectionChange();
    },

    _deselectItems: function ($items: JQueryElement): void {
      $items.removeClass((this.settings as any).selectedClass);

      if ((this.settings as any).checkboxClass) {
        const $checkboxes = $items.find(
          `.${(this.settings as any).checkboxClass}`
        );
        $checkboxes.attr('aria-checked', 'false');
      }

      this.$selectedItems = this.$selectedItems!.not($items);
      this.onSelectionChange();
    },

    /**
     * Deinitialize an item.
     */
    _deinitItem: function (item: HTMLElement): void {
      const $handle = $.data(item, 'select-handle') as JQueryElement;

      if ($handle) {
        $handle.removeData('select-item');
        this.removeAllListeners($handle);
      }

      $.removeData(item, 'select');
      $.removeData(item, 'select-handle');

      if (this.$focusedItem && this.$focusedItem[0] === item) {
        this.$focusedItem = null;
      }
    },
  },
  {
    defaults: {
      selectedClass: 'sel',
      checkboxClass: 'checkbox',
      multi: false,
      allowEmpty: true,
      vertical: false,
      horizontal: false,
      handle: null,
      filter: null,
      checkboxMode: false,
      makeFocusable: false,
      waitForDoubleClicks: false,
      onSelectionChange: $.noop,
    } as SelectSettings,

    closestItemAxisProps: {
      x: {
        midpointOffset: 'top',
        midpointSizeFunc: 'outerHeight',
        rowOffset: 'left',
      },
      y: {
        midpointOffset: 'left',
        midpointSizeFunc: 'outerWidth',
        rowOffset: 'top',
      },
    },

    closestItemDirectionProps: {
      '<': {
        step: -1,
        isNextRow: function (a: number, b: number): boolean {
          return a < b;
        },
        isWrongDirection: function (a: number, b: number): boolean {
          return a > b;
        },
      },
      '>': {
        step: 1,
        isNextRow: function (a: number, b: number): boolean {
          return a > b;
        },
        isWrongDirection: function (a: number, b: number): boolean {
          return a < b;
        },
      },
    },
  }
);
