import Garnish from './Garnish';
import Drag from './Drag';
import $ from 'jquery';
import type {
  DragSortInterface,
  DragSortSettings,
  JQueryElement,
  ElementOrJQuery,
} from './types';

/**
 * Drag-to-sort class
 *
 * Builds on the Drag class by allowing you to sort the elements amongst themselves.
 */
export default Drag.extend<DragSortInterface>(
  {
    $heightedContainer: null,
    $insertion: null,
    insertionVisible: false,
    oldDraggeeIndexes: null,
    newDraggeeIndexes: null,
    closestItem: null,

    _midpointVersion: 0,
    _$prevItem: null,

    /**
     * Constructor
     *
     * @param {object} items    Elements that should be draggable right away. (Can be skipped.)
     * @param {object} settings Any settings that should override the defaults.
     */
    init(items?: ElementOrJQuery, settings?: DragSortSettings): void {
      // Param mapping
      if (typeof settings === 'undefined' && $.isPlainObject(items)) {
        // (settings)
        settings = items as DragSortSettings;
        items = undefined;
      }

      settings = $.extend({}, (Garnish as any).DragSort.defaults, settings);
      this.base(items, settings);
    },

    /**
     * Creates the insertion element.
     */
    createInsertion(): JQueryElement | undefined {
      if (this.settings.insertion) {
        if (typeof this.settings.insertion === 'function') {
          return $(this.settings.insertion(this.$draggee!));
        } else {
          return $(this.settings.insertion);
        }
      }
    },

    /**
     * Returns the helper's target X position
     */
    getHelperTargetX(): number {
      if (this.settings.magnetStrength !== 1) {
        const draggeeOffsetX = this.$draggee!.offset()!.left;
        return (
          draggeeOffsetX +
          (this.mouseX! - this.mouseOffsetX! - draggeeOffsetX) /
            this.settings.magnetStrength!
        );
      } else {
        return this.base();
      }
    },

    /**
     * Returns the helper's target Y position
     */
    getHelperTargetY(): number {
      if (this.settings.magnetStrength !== 1) {
        const draggeeOffsetY = this.$draggee!.offset()!.top;
        return (
          draggeeOffsetY +
          (this.mouseY! - this.mouseOffsetY! - draggeeOffsetY) /
            this.settings.magnetStrength!
        );
      } else {
        return this.base();
      }
    },

    /**
     * Returns whether the draggee can be inserted before a given item.
     */
    canInsertBefore($item: JQueryElement): boolean {
      return true;
    },

    /**
     * Returns whether the draggee can be inserted after a given item.
     */
    canInsertAfter($item: JQueryElement): boolean {
      return true;
    },

    // Events
    // ---------------------------------------------------------------------

    /**
     * On Drag Start
     */
    onDragStart(): void {
      this.oldDraggeeIndexes = this._getDraggeeIndexes();

      // Are we supposed to be moving the target item to the front, and is it not already there?
      if (
        this.settings.moveTargetItemToFront &&
        this.$draggee!.length > 1 &&
        this._getItemIndex(this.$draggee![0]) >
          this._getItemIndex(this.$draggee![1])
      ) {
        // Reposition the target item before the other draggee items in the DOM
        this.$draggee!.first().insertBefore(this.$draggee![1]);
      }

      // Create the insertion
      this.$insertion = this.createInsertion()!;
      this._placeInsertionWithDraggee();

      this.closestItem = null;
      this._clearMidpoints();

      //  Get the closest container that has a height
      if (this.settings.container) {
        this.$heightedContainer = $(this.settings.container);

        while (!this.$heightedContainer.height()) {
          this.$heightedContainer = this.$heightedContainer.parent();
        }
      }

      this.base();
    },

    /**
     * On Drag
     */
    onDrag(): void {
      // If there's a container set, make sure that we're hovering over it
      if (
        this.$heightedContainer &&
        !(Garnish as any).hitTest(
          this.mouseX,
          this.mouseY,
          this.$heightedContainer
        )
      ) {
        if (this.closestItem) {
          this.closestItem = null;
          this._removeInsertion();
        }
      } else {
        // Is there a new closest item?
        const newClosestItem = this._getClosestItem();
        if (this.closestItem !== newClosestItem && newClosestItem !== null) {
          this.closestItem = newClosestItem;
          this._updateInsertion();
        }
      }

      this.base();
    },

    /**
     * On Drag Stop
     */
    onDragStop(): void {
      this._removeInsertion();

      // Should we keep the target item where it was?
      if (
        !this.settings.moveTargetItemToFront &&
        this.targetItemPositionInDraggee !== 0
      ) {
        this.$targetItem!.insertAfter(
          this.$draggee!.eq(this.targetItemPositionInDraggee!)
        );
      }

      // Return the helpers to the draggees
      this.returnHelpersToDraggees();

      this.base();

      // Has the item actually moved?
      this.$items = $().add(this.$items);
      this.newDraggeeIndexes = this._getDraggeeIndexes();

      if (
        this.newDraggeeIndexes.join(',') !== this.oldDraggeeIndexes!.join(',')
      ) {
        this.onSortChange();
      }
    },

    /**
     * On Insertion Point Change event
     */
    onInsertionPointChange(): void {
      (Garnish as any).requestAnimationFrame(
        function (this: DragSortInterface) {
          this.trigger('insertionPointChange');
          this.settings.onInsertionPointChange!();
        }.bind(this)
      );
    },

    /**
     * On Sort Change event
     */
    onSortChange(): void {
      (Garnish as any).requestAnimationFrame(
        function (this: DragSortInterface) {
          this.trigger('sortChange');
          this.settings.onSortChange!();
        }.bind(this)
      );
    },

    // Private methods
    // ---------------------------------------------------------------------

    _getItemIndex(item: HTMLElement): number {
      return $.inArray(item, this.$items!.toArray());
    },

    _getDraggeeIndexes(): number[] {
      const indexes: number[] = [];

      for (let i = 0; i < this.$draggee!.length; i++) {
        indexes.push(this._getItemIndex(this.$draggee![i]));
      }

      return indexes;
    },

    /**
     * Returns the closest item to the cursor.
     */
    _getClosestItem(): HTMLElement | null {
      let closestItem: HTMLElement | null = null;
      let closestItemMouseDistX: number | null = null;
      let closestItemMouseDistY: number | null = null;

      // Start by checking the draggee/insertion, if either are visible
      if (!this.settings.removeDraggee) {
        this._testForClosestItem(this.$draggee![0]);
        closestItem = this.$draggee![0];
      } else if (this.insertionVisible) {
        this._testForClosestItem(this.$insertion![0]);
        closestItem = this.$insertion![0];
      }

      // Check items before the draggee
      let midpoint: {x: number; y: number};
      let startXDist: number | null = null;
      let lastXDist: number | null = null;
      let startYDist: number | null = null;
      let lastYDist: number | null = null;

      if (closestItem) {
        midpoint = this._getItemMidpoint(closestItem);
        if (this.settings.axis !== (Garnish as any).Y_AXIS) {
          startXDist = lastXDist = Math.abs(
            midpoint.x - this.draggeeVirtualMidpointX!
          );
        }
        if (this.settings.axis !== (Garnish as any).X_AXIS) {
          startYDist = lastYDist = Math.abs(
            midpoint.y - this.draggeeVirtualMidpointY!
          );
        }
      }

      let $otherItem = this.$draggee!.first().prev();

      while ($otherItem.length) {
        // See if we're just getting further away
        midpoint = this._getItemMidpoint($otherItem[0]);
        let xDist: number | undefined;
        let yDist: number | undefined;

        if (this.settings.axis !== (Garnish as any).Y_AXIS) {
          xDist = Math.abs(midpoint.x - this.draggeeVirtualMidpointX!);
        }
        if (this.settings.axis !== (Garnish as any).X_AXIS) {
          yDist = Math.abs(midpoint.y - this.draggeeVirtualMidpointY!);
        }

        if (
          (this.settings.axis === (Garnish as any).Y_AXIS ||
            (lastXDist !== null && xDist! > lastXDist)) &&
          (this.settings.axis === (Garnish as any).X_AXIS ||
            (lastYDist !== null && yDist! > lastYDist))
        ) {
          break;
        }

        if (this.settings.axis !== (Garnish as any).Y_AXIS) {
          lastXDist = xDist!;
        }
        if (this.settings.axis !== (Garnish as any).X_AXIS) {
          lastYDist = yDist!;
        }

        // Give the extending class a chance to allow/disallow this item
        if (this.canInsertBefore($otherItem)) {
          const testResult = this._testForClosestItem($otherItem[0]);
          if (testResult.isCloser) {
            closestItem = $otherItem[0];
            closestItemMouseDistX = testResult.mouseDistX;
            closestItemMouseDistY = testResult.mouseDistY;
          }
        }

        // Prep the next item
        $otherItem = $otherItem.prev();
      }

      // Check items after the draggee
      if (this.settings.axis !== (Garnish as any).Y_AXIS) {
        lastXDist = startXDist;
      }
      if (this.settings.axis !== (Garnish as any).X_AXIS) {
        lastYDist = startYDist;
      }

      $otherItem = this.$draggee!.last().next();

      while ($otherItem.length) {
        // See if we're just getting further away
        midpoint = this._getItemMidpoint($otherItem[0]);
        let xDist: number | undefined;
        let yDist: number | undefined;

        if (this.settings.axis !== (Garnish as any).Y_AXIS) {
          xDist = Math.abs(midpoint.x - this.draggeeVirtualMidpointX!);
        }
        if (this.settings.axis !== (Garnish as any).X_AXIS) {
          yDist = Math.abs(midpoint.y - this.draggeeVirtualMidpointY!);
        }

        if (
          (this.settings.axis === (Garnish as any).Y_AXIS ||
            (lastXDist !== null && xDist! > lastXDist)) &&
          (this.settings.axis === (Garnish as any).X_AXIS ||
            (lastYDist !== null && yDist! > lastYDist))
        ) {
          break;
        }

        if (this.settings.axis !== (Garnish as any).Y_AXIS) {
          lastXDist = xDist!;
        }
        if (this.settings.axis !== (Garnish as any).X_AXIS) {
          lastYDist = yDist!;
        }

        // Give the extending class a chance to allow/disallow this item
        if (this.canInsertAfter($otherItem)) {
          const testResult = this._testForClosestItem($otherItem[0]);
          if (testResult.isCloser) {
            closestItem = $otherItem[0];
            closestItemMouseDistX = testResult.mouseDistX;
            closestItemMouseDistY = testResult.mouseDistY;
          }
        }

        // Prep the next item
        $otherItem = $otherItem.next();
      }

      // Return the result
      // Ignore if it's the draggee or insertion
      if (
        closestItem !== this.$draggee![0] &&
        (!this.insertionVisible || closestItem !== this.$insertion![0])
      ) {
        return closestItem;
      } else {
        return null;
      }
    },

    _clearMidpoints(): void {
      (this as any)._midpointVersion++;
      (this as any)._$prevItem = null;
    },

    _getItemMidpoint(item: HTMLElement): {x: number; y: number} {
      if ($.data(item, 'midpointVersion') !== (this as any)._midpointVersion) {
        // If this isn't the draggee, temporarily move the draggee to this item
        const repositionDraggee =
          !this.settings.axis &&
          (!this.settings.removeDraggee || this.insertionVisible) &&
          item !== this.$draggee![0] &&
          (!this.$insertion || item !== this.$insertion.get(0));

        if (repositionDraggee) {
          // Is this the first time we've had to temporarily reposition the draggee since the last midpoint clearing?
          if (!(this as any)._$prevItem) {
            (this as any)._$prevItem = (
              this.insertionVisible ? this.$insertion : this.$draggee
            )!
              .first()
              .prev();
          }

          this._moveDraggeeToItem(item);

          // Now figure out which element we're actually getting the midpoint of
          let $item: JQueryElement;
          if (!this.settings.removeDraggee) {
            $item = this.$draggee!;
          } else {
            $item = this.$insertion!;
          }

          const offset = $item.offset()!;

          $.data(item, 'midpoint', {
            x: offset.left + $item.outerWidth()! / 2,
            y: offset.top + $item.outerHeight()! / 2,
          });

          // Move the draggee back
          if ((this as any)._$prevItem.length) {
            this.$draggee!.insertAfter((this as any)._$prevItem);
          } else {
            this.$draggee!.prependTo(this.$draggee!.parent());
          }

          this._placeInsertionWithDraggee();
        } else {
          // We're actually getting the midpoint of this item
          const $item = $(item);
          const offset = $item.offset()!;

          $.data(item, 'midpoint', {
            x: offset.left + $item.outerWidth()! / 2,
            y: offset.top + $item.outerHeight()! / 2,
          });
        }

        $.data(item, 'midpointVersion', (this as any)._midpointVersion);
      }

      return $.data(item, 'midpoint');
    },

    _testForClosestItem(item: HTMLElement): {
      isCloser: boolean;
      mouseDistX: number;
      mouseDistY: number;
    } {
      const midpoint = this._getItemMidpoint(item);
      const mouseDistX = Math.abs(midpoint.x - this.draggeeVirtualMidpointX!);
      const mouseDistY = Math.abs(midpoint.y - this.draggeeVirtualMidpointY!);

      // Don't even consider items that are further away on the Y axis
      const isCloser =
        this.closestItem === null ||
        mouseDistY < (this as any)._closestItemMouseDistY ||
        (mouseDistY === (this as any)._closestItemMouseDistY &&
          mouseDistX <= (this as any)._closestItemMouseDistX);

      if (isCloser) {
        (this as any)._closestItemMouseDistX = mouseDistX;
        (this as any)._closestItemMouseDistY = mouseDistY;
      }

      return {isCloser, mouseDistX, mouseDistY};
    },

    /**
     * Updates the position of the insertion point.
     */
    _updateInsertion(): void {
      if (this.closestItem) {
        this._moveDraggeeToItem(this.closestItem);
      }

      // Now that things have shifted around, invalidate the midpoints
      this._clearMidpoints();

      this.onInsertionPointChange();
    },

    _moveDraggeeToItem(item: HTMLElement): void {
      // Going down?
      if (this.$draggee!.index() < $(item).index()) {
        this.$draggee!.insertAfter(item);
      } else {
        this.$draggee!.insertBefore(item);
      }

      this._placeInsertionWithDraggee();
    },

    _placeInsertionWithDraggee(): void {
      if (this.$insertion) {
        this.$insertion.insertBefore(this.$draggee!.first());
        this.insertionVisible = true;
      }
    },

    /**
     * Removes the insertion, if it's visible.
     */
    _removeInsertion(): void {
      if (this.insertionVisible) {
        this.$insertion!.remove();
        this.insertionVisible = false;
      }
    },
  },
  {
    defaults: {
      container: null,
      insertion: null,
      moveTargetItemToFront: false,
      magnetStrength: 1,
      onInsertionPointChange: $.noop,
      onSortChange: $.noop,
    } as DragSortSettings,
  }
);
