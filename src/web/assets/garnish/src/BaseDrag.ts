import Garnish from './Garnish';
import Base from './Base';
import $ from 'jquery';
import {
  BaseDragSettings,
  BaseDragInterface,
  JQueryElement,
  ElementOrJQuery,
} from './types';

/**
 * Base drag class
 *
 * Does all the grunt work for manipulating elements via click-and-drag,
 * while leaving the actual element manipulation up to a subclass.
 */

const BaseDrag = Base.extend<BaseDragInterface>(
  {
    $items: null as any,
    dragging: false,
    mousedownX: null,
    mousedownY: null,
    realMouseX: null,
    realMouseY: null,
    mouseX: null,
    mouseY: null,
    mouseDistX: null,
    mouseDistY: null,
    mouseOffsetX: null,
    mouseOffsetY: null,
    $targetItem: null,
    scrollProperty: null,
    scrollAxis: null,
    scrollDist: null,
    scrollFrame: null,
    _: null as any,

    /**
     * Constructor
     *
     * @param items    Elements that should be draggable right away. (Can be skipped.)
     * @param settings Any settings that should override the defaults.
     */
    init: function (
      this: BaseDragInterface,
      items?: ElementOrJQuery | BaseDragSettings,
      settings?: BaseDragSettings
    ): void {
      // Param mapping
      if (typeof settings === 'undefined' && $.isPlainObject(items)) {
        // (settings)
        settings = items as BaseDragSettings;
        items = undefined;
      }

      this.settings = $.extend({}, (BaseDrag as any).defaults, settings);

      this.$items = $();
      this._ = {};

      if (items) {
        this.addItems(items as ElementOrJQuery);
      }
    },

    /**
     * Returns whether dragging is allowed right now.
     */
    allowDragging: function (this: BaseDragInterface): boolean {
      return true;
    },

    /**
     * Start Dragging
     */
    startDragging: function (this: BaseDragInterface): void {
      this.onBeforeDragStart();
      this.dragging = true;
      this.setScrollContainer();
      this.onDragStart();

      // Mute activate events
      Garnish.activateEventsMuted = true;
    },

    setScrollContainer: function (this: BaseDragInterface): void {
      (this as any)._.$scrollContainer = this.$targetItem!.scrollParent();

      while (true) {
        if (
          (this as any)._.$scrollContainer[0] === Garnish.$doc[0] ||
          (this as any)._.$scrollContainer[0] === Garnish.$bod[0]
        ) {
          (this as any)._.$scrollContainer = Garnish.$win;
          break;
        }

        if (
          // if we're able to drag vertically and the container is vertically scrollable
          (this.settings.axis !== Garnish.X_AXIS &&
            (this as any)._.$scrollContainer[0].scrollHeight >
              (this as any)._.$scrollContainer[0].clientHeight) ||
          // or if we're able to drag horizontally and the container is horizontally scrollable
          (this.settings.axis !== Garnish.Y_AXIS &&
            (this as any)._.$scrollContainer[0].scrollWidth >
              (this as any)._.$scrollContainer[0].clientWidth)
        ) {
          // ...we found our scroll container
          break;
        }

        (this as any)._.$scrollContainer = (
          this as any
        )._.$scrollContainer.scrollParent();
      }
    },

    isScrollingWindow: function (this: BaseDragInterface): boolean {
      return (this as any)._.$scrollContainer[0] === Garnish.$win[0];
    },

    /**
     * Drag
     */
    drag: function (this: BaseDragInterface, didMouseMove?: boolean): void {
      if (didMouseMove) {
        // Is the mouse up against one of the window edges?
        (this.drag as any)._scrollProperty = null;

        if (this.settings.axis !== Garnish.X_AXIS) {
          if (this.isScrollingWindow()) {
            (this.drag as any)._minMouseScrollY = Garnish.$win.scrollTop();
            (this.drag as any)._maxMouseScrollY =
              (this.drag as any)._minMouseScrollY + Garnish.$win.height();
          } else {
            (this.drag as any)._minMouseScrollY = (
              this as any
            )._.$scrollContainer.offset().top;
            (this.drag as any)._maxMouseScrollY =
              (this.drag as any)._minMouseScrollY +
              (this as any)._.$scrollContainer.outerHeight();
          }

          (this.drag as any)._minMouseScrollY += (
            BaseDrag as any
          ).windowScrollTargetSize;
          (this.drag as any)._maxMouseScrollY -= (
            BaseDrag as any
          ).windowScrollTargetSize;

          if (this.mouseY! < (this.drag as any)._minMouseScrollY) {
            // Scrolling up
            (this.drag as any)._scrollProperty = 'scrollTop';
            (this.drag as any)._scrollAxis = 'Y';
            (this.drag as any)._scrollDist = Math.round(
              (this.mouseY! - (this.drag as any)._minMouseScrollY) / 2
            );
          } else if (this.mouseY! > (this.drag as any)._maxMouseScrollY) {
            // Scrolling down
            (this.drag as any)._scrollProperty = 'scrollTop';
            (this.drag as any)._scrollAxis = 'Y';
            (this.drag as any)._scrollDist = Math.round(
              (this.mouseY! - (this.drag as any)._maxMouseScrollY) / 2
            );
          }
        }

        if (this.settings.axis !== Garnish.Y_AXIS) {
          if (this.isScrollingWindow()) {
            (this.drag as any)._minMouseScrollX = Garnish.$win.scrollLeft();
            (this.drag as any)._maxMouseScrollX =
              (this.drag as any)._minMouseScrollX + Garnish.$win.width();
          } else {
            (this.drag as any)._minMouseScrollX = (
              this as any
            )._.$scrollContainer.offset().left;
            (this.drag as any)._maxMouseScrollX =
              (this.drag as any)._minMouseScrollX +
              (this as any)._.$scrollContainer.outerWidth();
          }

          (this.drag as any)._minMouseScrollX += (
            BaseDrag as any
          ).windowScrollTargetSize;
          (this.drag as any)._maxMouseScrollX -= (
            BaseDrag as any
          ).windowScrollTargetSize;

          if (this.mouseX! < (this.drag as any)._minMouseScrollX) {
            // Scrolling left
            (this.drag as any)._scrollProperty = 'scrollLeft';
            (this.drag as any)._scrollAxis = 'X';
            (this.drag as any)._scrollDist = Math.round(
              (this.mouseX! - (this.drag as any)._minMouseScrollX) / 2
            );
          } else if (this.mouseX! > (this.drag as any)._maxMouseScrollX) {
            // Scrolling right
            (this.drag as any)._scrollProperty = 'scrollLeft';
            (this.drag as any)._scrollAxis = 'X';
            (this.drag as any)._scrollDist = Math.round(
              (this.mouseX! - (this.drag as any)._maxMouseScrollX) / 2
            );
          }
        }

        // Scroll the window?
        if ((this.drag as any)._scrollProperty) {
          this.scrollProperty = (this.drag as any)._scrollProperty;
          this.scrollAxis = (this.drag as any)._scrollAxis;
          this.scrollDist = (this.drag as any)._scrollDist;

          if (!this.scrollFrame) {
            this._scrollWindow();
          }
        } else {
          this._cancelWindowScroll();
        }
      }

      this.onDrag();
    },

    /**
     * Stop Dragging
     */
    stopDragging: function (this: BaseDragInterface): void {
      this.dragging = false;
      this._cancelWindowScroll();
      this.onDragStop();

      // Unmute activate events
      Garnish.activateEventsMuted = false;
    },

    /**
     * Add Items
     *
     * @param items Elements that should be draggable.
     */
    addItems: function (this: BaseDragInterface, items: ElementOrJQuery): void {
      const $items = $(items);
      const self = this;

      $items.each(function (this: HTMLElement) {
        const item = this;

        // Make sure this element doesn't belong to another dragger
        if ($.data(item, 'drag')) {
          Garnish.log('Double-dipping on the drag juice!');
          return;
        }

        $.data(item, 'drag', self);

        self.addListener(item, 'mousedown', '_handleMouseDown');
        self.addListener(item, 'mousemove', '_handleMouseMove');
        self.addListener(item, 'keydown', '_handleKeyDown');
        self.addListener(item, 'click', '_handleClick');
      });

      this.$items = this.$items.add($items);
    },

    /**
     * Remove Items
     *
     * @param items Elements that should no longer be draggable.
     */
    removeItems: function (
      this: BaseDragInterface,
      items: ElementOrJQuery
    ): void {
      const itemsArray = $.makeArray(items) as HTMLElement[];

      for (let i = 0; i < itemsArray.length; i++) {
        const item = itemsArray[i];

        // Make sure we actually know about this item
        const index = $.inArray(item, this.$items.get());
        if (index !== -1) {
          this._deinitItem(item);
          this.$items.splice(index, 1);
        }
      }
    },

    /**
     * Remove All Items
     */
    removeAllItems: function (this: BaseDragInterface): void {
      for (let i = 0; i < this.$items.length; i++) {
        this._deinitItem(this.$items[i]);
      }

      this.$items = $();
    },

    /**
     * Destroy
     */
    destroy: function (this: BaseDragInterface): void {
      this.removeAllItems();
      (this as any).base();
    },

    // Events
    // ---------------------------------------------------------------------

    /**
     * On Before Drag Start
     */
    onBeforeDragStart: function (this: BaseDragInterface): void {
      (this as any).trigger('beforeDragStart');
      this.settings.onBeforeDragStart?.();
    },

    /**
     * On Drag Start
     */
    onDragStart: function (this: BaseDragInterface): void {
      Garnish.requestAnimationFrame(() => {
        (this as any).trigger('dragStart');
        this.settings.onDragStart?.();
      });
    },

    /**
     * On Drag
     */
    onDrag: function (this: BaseDragInterface): void {
      Garnish.requestAnimationFrame(() => {
        (this as any).trigger('drag');
        this.settings.onDrag?.();
      });
    },

    /**
     * On Drag Stop
     */
    onDragStop: function (this: BaseDragInterface): void {
      Garnish.requestAnimationFrame(() => {
        (this as any).trigger('dragStop');
        this.settings.onDragStop?.();
      });
    },

    // Private methods
    // ---------------------------------------------------------------------

    /**
     * Handle Mouse Down
     */
    _handleMouseDown: function (
      this: BaseDragInterface,
      ev: JQuery.TriggeredEvent,
      item?: HTMLElement
    ): void {
      // Ignore right/ctrl-clicks
      if (!Garnish.isPrimaryClick(ev)) {
        return;
      }

      // Ignore if a text input is being clicked
      if (
        $(ev.target as HTMLElement).is(
          'input[type=text], input[type=email], input[type=url], input[type=password], input[type=number], input[type=search], textarea'
        )
      ) {
        return;
      }

      const realTarget = ev.target as HTMLElement;
      let $target = $(realTarget);
      let targetIsHandle = false;

      // If a handle has been specified, only respond to mousedown events
      // on the handle or its descendants
      if (this.settings.handle) {
        const $handle =
          typeof this.settings.handle === 'string'
            ? $(this.settings.handle)
            : this.settings.handle;

        if ($target.is($handle) || $handle.find($target).length) {
          targetIsHandle = true;
        }
      } else {
        targetIsHandle = true;
      }

      if (!targetIsHandle) {
        return;
      }

      // Make sure the target isn't an ignore handle selector
      if (
        this.settings.ignoreHandleSelector &&
        $target.is(this.settings.ignoreHandleSelector)
      ) {
        return;
      }

      ev.preventDefault();

      // Capture the target
      this.$targetItem = $(item || ev.currentTarget);

      // Capture the current mouse position
      this.mousedownX = this.mouseX = ev.pageX;
      this.mousedownY = this.mouseY = ev.pageY;
      this.realMouseX = ev.pageX;
      this.realMouseY = ev.pageY;

      this.mouseOffsetX = ev.pageX - this.$targetItem.offset()!.left;
      this.mouseOffsetY = ev.pageY - this.$targetItem.offset()!.top;

      // Listen for mousemove, mouseup
      this.addListener(Garnish.$doc, 'mousemove', '_handleMouseMove');
      this.addListener(Garnish.$doc, 'mouseup', '_handleMouseUp');
    },

    /**
     * Handle Mouse Move
     */
    _handleMouseMove: function (
      this: BaseDragInterface,
      ev: JQuery.TriggeredEvent
    ): void {
      if (this.mouseX !== null && this.mouseY !== null) {
        const mouseDistX = ev.pageX - this.mouseX;
        const mouseDistY = ev.pageY - this.mouseY;
        this.mouseDistX = mouseDistX;
        this.mouseDistY = mouseDistY;

        this.mouseX = this.realMouseX = ev.pageX;
        this.mouseY = this.realMouseY = ev.pageY;

        if (this.dragging) {
          this.drag(true);
          return false;
        }

        // Has the mouse moved far enough to initiate dragging yet?
        const minMouseDist =
          this.settings.minMouseDist || (BaseDrag as any).minMouseDist;
        const mouseDistTotal = Math.sqrt(
          Math.pow(mouseDistX, 2) + Math.pow(mouseDistY, 2)
        );

        if (mouseDistTotal >= minMouseDist && this.allowDragging()) {
          this.startDragging();
          return false;
        }
      }
    },

    /**
     * Handle Mouse Up
     */
    _handleMouseUp: function (
      this: BaseDragInterface,
      ev: JQuery.TriggeredEvent
    ): void {
      // Remove the mouse event listeners
      this.removeListener(Garnish.$doc, 'mousemove');
      this.removeListener(Garnish.$doc, 'mouseup');

      if (this.dragging) {
        this.stopDragging();
      }

      this.$targetItem = null;
    },

    /**
     * Handle Key Down
     */
    _handleKeyDown: function (
      this: BaseDragInterface,
      ev: JQuery.TriggeredEvent
    ): void {
      if (ev.keyCode === Garnish.ESC_KEY && this.dragging) {
        this.cancelDrag();
      }
    },

    /**
     * Handle Click
     */
    _handleClick: function (
      this: BaseDragInterface,
      ev: JQuery.TriggeredEvent
    ): void {
      if (this._.wasJustDragging) {
        ev.preventDefault();
        this._.wasJustDragging = false;
      }
    },

    /**
     * Cancel Drag
     */
    cancelDrag: function (this: BaseDragInterface): void {
      this.stopDragging();
    },

    /**
     * Scroll Window
     */
    _scrollWindow: function (this: BaseDragInterface): void {
      const minScrollPos = 0;
      let maxScrollPos;

      if (this.scrollProperty === 'scrollLeft') {
        maxScrollPos = Garnish.$bod.prop('scrollWidth') - Garnish.$win.width();
      } else {
        maxScrollPos =
          Garnish.$bod.prop('scrollHeight') - Garnish.$win.height();
      }

      if (this.isScrollingWindow()) {
        this._.scrollPos = Garnish.$win[this.scrollProperty!]();
      } else {
        this._.scrollPos = (this as any)._.$scrollContainer[
          this.scrollProperty!
        ]();
      }

      let targetScrollPos = this._.scrollPos + this.scrollDist!;

      if (targetScrollPos < minScrollPos) {
        targetScrollPos = minScrollPos;
      } else if (targetScrollPos > maxScrollPos) {
        targetScrollPos = maxScrollPos;
      }

      if (this.isScrollingWindow()) {
        Garnish.$win[this.scrollProperty!](targetScrollPos);
      } else {
        (this as any)._.$scrollContainer[this.scrollProperty!](targetScrollPos);
      }

      // Did we scroll at all?
      let newScrollPos;
      if (this.isScrollingWindow()) {
        newScrollPos = Garnish.$win[this.scrollProperty!]();
      } else {
        newScrollPos = (this as any)._.$scrollContainer[this.scrollProperty!]();
      }

      if (newScrollPos !== this._.scrollPos) {
        // Update the mouse coordinates to account for the scroll change
        if (this.scrollAxis === 'Y') {
          this['mouse' + this.scrollAxis] -=
            this._.scrollPos - Garnish.$win[this.scrollProperty!]();
          this['realMouse' + this.scrollAxis] = this['mouse' + this.scrollAxis];
        }

        this.scrollFrame = Garnish.requestAnimationFrame(() => {
          this._scrollWindow();
        });

        this.drag(true);
      }
    },

    /**
     * Cancel Window Scroll
     */
    _cancelWindowScroll: function (this: BaseDragInterface): void {
      if (this.scrollFrame) {
        Garnish.cancelAnimationFrame(this.scrollFrame);
        this.scrollFrame = null;
      }

      this.scrollProperty = null;
      this.scrollAxis = null;
      this.scrollDist = null;
    },

    /**
     * Deinitialize an item.
     */
    _deinitItem: function (this: BaseDragInterface, item: HTMLElement): void {
      (this as any).removeAllListeners(item);
      $.removeData(item, 'drag');
    },
  },
  {
    minMouseDist: 1,
    windowScrollTargetSize: 25,

    defaults: {
      minMouseDist: null,
      handle: null,
      axis: null,
      ignoreHandleSelector: 'input, textarea, button, select, .btn',

      onBeforeDragStart: $.noop,
      onDragStart: $.noop,
      onDrag: $.noop,
      onDragStop: $.noop,
    } as BaseDragSettings,
  }
);

export default BaseDrag;
