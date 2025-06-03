import Garnish from './Garnish';
import Drag from './Drag';
import {DragDropInterface, DragDropSettings, JQueryElement} from './types';
import $ from 'jquery';

/**
 * Drag-and-drop class
 *
 * Builds on the Drag class by allowing you to set up "drop targets"
 * which the dragged elemements can be dropped onto.
 */
export default Drag.extend(
  {
    $dropTargets: null as JQueryElement | null,
    $activeDropTarget: null as JQueryElement | null,

    /**
     * Constructor
     */
    init: function (settings?: DragDropSettings): void {
      settings = $.extend({}, Garnish.DragDrop.defaults, settings);
      this.base(settings);
    },

    updateDropTargets: function (): void {
      if (this.settings.dropTargets) {
        if (typeof this.settings.dropTargets === 'function') {
          this.$dropTargets = $(this.settings.dropTargets());
        } else {
          this.$dropTargets = $(this.settings.dropTargets);
        }

        // Discard if it's an empty array
        if (!this.$dropTargets.length) {
          this.$dropTargets = null;
        }
      }
    },

    /**
     * On Drag Start
     */
    onDragStart: function (): void {
      this.updateDropTargets();
      this.$activeDropTarget = null;
      this.base();
    },

    /**
     * On Drag
     */
    onDrag: function (): void {
      if (this.$dropTargets) {
        let activeDropTarget: HTMLElement | null = null;

        // is the cursor over any of the drop target?
        for (let i = 0; i < this.$dropTargets.length; i++) {
          const elem = this.$dropTargets[i];

          if (Garnish.hitTest(this.mouseX, this.mouseY, elem)) {
            activeDropTarget = elem;
            break;
          }
        }

        // has the drop target changed?
        if (
          (this.$activeDropTarget &&
            activeDropTarget !== this.$activeDropTarget[0]) ||
          (!this.$activeDropTarget && activeDropTarget !== null)
        ) {
          // was there a previous one?
          if (this.$activeDropTarget) {
            this.$activeDropTarget.removeClass(
              this.settings.activeDropTargetClass!
            );
          }

          // remember the new one
          if (activeDropTarget) {
            this.$activeDropTarget = $(activeDropTarget).addClass(
              this.settings.activeDropTargetClass!
            );
          } else {
            this.$activeDropTarget = null;
          }

          this.settings.onDropTargetChange!(this.$activeDropTarget);
        }
      }

      this.base();
    },

    /**
     * On Drag Stop
     */
    onDragStop: function (): void {
      if (this.$dropTargets && this.$activeDropTarget) {
        this.$activeDropTarget.removeClass(
          this.settings.activeDropTargetClass!
        );
      }

      this.base();
    },

    /**
     * Fade Out Helpers
     */
    fadeOutHelpers: function (): void {
      for (var i = 0; i < this.helpers.length; i++) {
        (function ($draggeeHelper: JQueryElement) {
          $draggeeHelper.velocity('fadeOut', {
            duration: Garnish.FX_DURATION,
            complete: function () {
              $draggeeHelper.remove();
            },
          });
        })(this.helpers[i]);
      }
    },
  } as DragDropInterface,
  {
    defaults: {
      dropTargets: null,
      onDropTargetChange: $.noop,
      activeDropTargetClass: 'active',
    } as DragDropSettings,
  }
);
