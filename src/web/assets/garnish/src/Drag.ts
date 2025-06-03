import Garnish from './Garnish';
import BaseDrag from './BaseDrag';
import $ from 'jquery';
import type {
  DragInterface,
  DragSettings,
  JQueryElement,
  ElementOrJQuery,
} from './types';

/**
 * Drag class
 *
 * Builds on the BaseDrag class by "picking up" the selected element(s),
 * without worrying about what to do when an element is being dragged.
 */
export default BaseDrag.extend<DragInterface>(
  {
    targetItemWidth: null,
    targetItemHeight: null,
    targetItemPositionInDraggee: null,

    $draggee: null,

    otherItems: null,
    totalOtherItems: null,

    helpers: null,
    helperTargets: null,
    helperPositions: null,
    helperLagIncrement: null,
    updateHelperPosProxy: null,
    updateHelperPosFrame: null,

    lastMouseX: null,
    lastMouseY: null,

    _returningHelpersToDraggees: false,

    /**
     * Constructor
     *
     * @param {object} items    Elements that should be draggable right away. (Can be skipped.)
     * @param {object} settings Any settings that should override the defaults.
     */
    init(items?: ElementOrJQuery, settings?: DragSettings): void {
      // Param mapping
      if (typeof settings === 'undefined' && $.isPlainObject(items)) {
        // (settings)
        settings = items as DragSettings;
        items = undefined;
      }

      settings = $.extend({}, (Garnish as any).Drag.defaults, settings);
      this.base(items, settings);
    },

    /**
     * Returns whether dragging is allowed right now.
     */
    allowDragging(): boolean {
      // Don't allow dragging if we're in the middle of animating the helpers back to the draggees
      return !this._returningHelpersToDraggees;
    },

    /**
     * Start Dragging
     */
    startDragging(): void {
      this.onBeforeDragStart();

      // Reset some things
      this.helpers = [];
      this.helperTargets = [];
      this.helperPositions = [];
      this.lastMouseX = this.lastMouseY = null;

      // Capture the target item's width/height
      this.targetItemWidth = this.$targetItem!.outerWidth()!;
      this.targetItemHeight = this.$targetItem!.outerHeight()!;

      // Save the draggee's display style (block/table-row) so we can re-apply it later
      this.draggeeDisplay = this.$targetItem!.css('display');

      // Set the $draggee
      this.setDraggee(this.findDraggee());

      // Create an array of all the other items
      this.otherItems = [];

      for (let i = 0; i < this.$items!.length; i++) {
        const item = this.$items![i];

        if ($.inArray(item, this.$draggee!.toArray()) === -1) {
          this.otherItems.push(item);
        }
      }

      this.totalOtherItems = this.otherItems.length;

      // Keep the helpers following the cursor, with a little lag to smooth it out
      if (!this.updateHelperPosProxy) {
        this.updateHelperPosProxy = this._updateHelperPos.bind(this);
      }

      this.helperLagIncrement =
        this.helpers.length === 1
          ? 0
          : this.settings.helperLagIncrementDividend! /
            (this.helpers.length - 1);
      this.updateHelperPosFrame = (Garnish as any).requestAnimationFrame(
        this.updateHelperPosProxy
      );

      this.dragging = true;
      this.setScrollContainer();
      this.onDragStart();

      // Mute activate events
      (Garnish as any).activateEventsMuted = true;
    },

    /**
     * Sets the draggee.
     */
    setDraggee($draggee: JQueryElement): void {
      // Record the target item's position in the draggee
      this.targetItemPositionInDraggee = $.inArray(
        this.$targetItem![0],
        $draggee.add(this.$targetItem![0]).toArray()
      );

      // Keep the target item at the front of the list
      this.$draggee = $(
        [this.$targetItem![0]].concat($draggee.not(this.$targetItem).toArray())
      );

      // Create the helper(s)
      if (this.settings.singleHelper) {
        this._createHelper(0);
      } else {
        for (let i = 0; i < this.$draggee.length; i++) {
          this._createHelper(i);
        }
      }

      if (this.settings.removeDraggee) {
        this.$draggee.hide();
      } else if (this.settings.collapseDraggees) {
        this.$targetItem!.css('visibility', 'hidden');
        this.$draggee.not(this.$targetItem).hide();
      } else if (this.settings.hideDraggee) {
        this.$draggee.css('visibility', 'hidden');
      }
    },

    /**
     * Appends additional items to the draggee.
     */
    appendDraggee($newDraggee: JQueryElement): void {
      if (!$newDraggee.length) {
        return;
      }

      let oldLength: number;
      if (!this.settings.collapseDraggees) {
        oldLength = this.$draggee!.length;
      }

      this.$draggee = $(this.$draggee!.toArray().concat($newDraggee.toArray()));

      // Create new helpers?
      if (!this.settings.collapseDraggees) {
        const newLength = this.$draggee.length;

        for (let i = oldLength!; i < newLength; i++) {
          this._createHelper(i);
        }
      }

      if (this.settings.removeDraggee || this.settings.collapseDraggees) {
        $newDraggee.hide();
      } else if (this.settings.hideDraggee) {
        $newDraggee.css('visibility', 'hidden');
      }
    },

    /**
     * Drag
     */
    drag(didMouseMove: boolean): void {
      // Update the draggee's virtual midpoint
      this.draggeeVirtualMidpointX =
        this.mouseX! - this.mouseOffsetX! + this.targetItemWidth! / 2;
      this.draggeeVirtualMidpointY =
        this.mouseY! - this.mouseOffsetY! + this.targetItemHeight! / 2;

      this.base(didMouseMove);
    },

    /**
     * Stop Dragging
     */
    stopDragging(): void {
      // Clear the helper animation
      (Garnish as any).cancelAnimationFrame(this.updateHelperPosFrame);

      this.base();
    },

    /**
     * Identifies the item(s) that are being dragged.
     */
    findDraggee(): JQueryElement {
      switch (typeof this.settings.filter) {
        case 'function': {
          return this.settings.filter();
        }

        case 'string': {
          return this.$items!.filter(this.settings.filter);
        }

        default: {
          return this.$targetItem!;
        }
      }
    },

    /**
     * Returns the helper's target X position
     */
    getHelperTargetX(real?: boolean): number {
      if (!real && this.settings.moveHelperToCursor) {
        return this.mouseX!;
      }
      return this.mouseX! - this.mouseOffsetX!;
    },

    /**
     * Returns the helper's target Y position
     */
    getHelperTargetY(real?: boolean): number {
      if (!real && this.settings.moveHelperToCursor) {
        return this.mouseY!;
      }
      return this.mouseY! - this.mouseOffsetY!;
    },

    /**
     * Return Helpers to Draggees
     */
    returnHelpersToDraggees(): void {
      this._returningHelpersToDraggees = true;

      for (let i = 0; i < this.helpers!.length; i++) {
        const $draggee = this.$draggee!.eq(i);
        const $helper = this.helpers![i];

        $draggee.css({
          display: this.draggeeDisplay!,
          visibility: this.settings.hideDraggee ? 'hidden' : '',
        });

        const draggeeOffset = $draggee.offset()!;
        let callback: (() => void) | null;

        if (i === 0) {
          callback = this._showDraggee.bind(this);
        } else {
          callback = null;
        }

        ($helper as any).velocity(
          {left: draggeeOffset.left, top: draggeeOffset.top},
          (Garnish as any).FX_DURATION,
          callback
        );
      }
    },

    // Events
    // ---------------------------------------------------------------------

    onReturnHelpersToDraggees(): void {
      (Garnish as any).requestAnimationFrame(
        function (this: DragInterface) {
          this.trigger('returnHelpersToDraggees');
          this.settings.onReturnHelpersToDraggees!();
        }.bind(this)
      );
    },

    // Private methods
    // ---------------------------------------------------------------------

    /**
     * Creates a helper.
     */
    _createHelper(index: number): void {
      const $draggee = this.$draggee!.eq(index);
      let $draggeeHelper = $draggee.clone().addClass('draghelper');

      if ($draggee.parents('#content').length) {
        $draggeeHelper.addClass('drag-in-content');
      }
      if ($draggee.parents('.slideout-container').length) {
        $draggeeHelper.addClass('drag-in-slideout');
      }

      if (this.settings.copyDraggeeInputValuesToHelper) {
        (Garnish as any).copyInputValues($draggee, $draggeeHelper);
      }

      // Remove any name= attributes so radio buttons don't lose their values
      $draggeeHelper.find('[name]').attr('name', '');

      $draggeeHelper
        .outerWidth(Math.ceil($draggee.outerWidth()!))
        .outerHeight(Math.ceil($draggee.outerHeight()!))
        .css({margin: 0, 'pointer-events': 'none'});

      if (this.settings.helper) {
        if (typeof this.settings.helper === 'function') {
          $draggeeHelper = this.settings.helper($draggeeHelper, index);
        } else {
          $draggeeHelper = $(this.settings.helper).append($draggeeHelper);
        }
      }

      $draggeeHelper.appendTo((Garnish as any).$bod);

      const helperPos = this._getHelperTarget(index, true);

      $draggeeHelper.css({
        position: 'absolute',
        top: helperPos.top,
        left: helperPos.left,
        zIndex: this.settings.helperBaseZindex! + this.$draggee!.length - index,
        display: this.draggeeDisplay!,
      });

      if (this.settings.helperOpacity != 1) {
        $draggeeHelper.css('opacity', this.settings.helperOpacity);
      }

      this.helperPositions![index] = {
        top: helperPos.top,
        left: helperPos.left,
      };

      this.helpers!.push($draggeeHelper);
    },

    /**
     * Update Helper Position
     */
    _updateHelperPos(): void {
      // Has the mouse moved?
      if (this.mouseX !== this.lastMouseX || this.mouseY !== this.lastMouseY) {
        // Get the new target helper positions
        for (let i = 0; i < this.helpers!.length; i++) {
          this.helperTargets![i] = this._getHelperTarget(i);
        }

        this.lastMouseX = this.mouseX;
        this.lastMouseY = this.mouseY;
      }

      // Gravitate helpers toward their target positions
      for (let j = 0; j < this.helpers!.length; j++) {
        const lag = this.settings.helperLagBase! + this.helperLagIncrement! * j;

        this.helperPositions![j] = {
          left:
            this.helperPositions![j].left +
            (this.helperTargets![j].left - this.helperPositions![j].left) / lag,
          top:
            this.helperPositions![j].top +
            (this.helperTargets![j].top - this.helperPositions![j].top) / lag,
        };

        this.helpers![j].css(this.helperPositions![j]);
      }

      // Let's do this again on the next frame!
      this.updateHelperPosFrame = (Garnish as any).requestAnimationFrame(
        this.updateHelperPosProxy!
      );
    },

    /**
     * Get the helper position for a draggee helper
     */
    _getHelperTarget(
      index: number,
      real?: boolean
    ): {left: number; top: number} {
      return {
        left:
          this.getHelperTargetX(real) + this.settings.helperSpacingX! * index,
        top:
          this.getHelperTargetY(real) + this.settings.helperSpacingY! * index,
      };
    },

    _showDraggee(): void {
      // Remove the helpers
      for (let i = 0; i < this.helpers!.length; i++) {
        this.helpers![i].remove();
      }

      this.helpers = null;

      this.$draggee!.show().css('visibility', '');

      this.onReturnHelpersToDraggees();

      this._returningHelpersToDraggees = false;
    },
  },
  {
    defaults: {
      filter: null,
      singleHelper: false,
      collapseDraggees: false,
      removeDraggee: false,
      hideDraggee: true,
      copyDraggeeInputValuesToHelper: false,
      helperOpacity: 1,
      moveHelperToCursor: false,
      helper: null,
      helperBaseZindex: 1000,
      helperLagBase: 3,
      helperLagIncrementDividend: 1.5,
      helperSpacingX: 5,
      helperSpacingY: 5,
      onReturnHelpersToDraggees: $.noop,
    } as DragSettings,
  }
);
