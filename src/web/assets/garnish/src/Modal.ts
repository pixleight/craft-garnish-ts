import Garnish from './Garnish';
import Base from './Base';
import $ from 'jquery';
import ResizeHandle from './icons/ResizeHandle';
import {
  ElementOrJQuery,
  JQueryElement,
  ModalInterface,
  ModalSettings,
} from './types';

/**
 * Modal
 */
export default Base.extend<ModalInterface>(
  {
    $container: null as JQueryElement | null,
    $shade: null as JQueryElement | null,
    $triggerElement: null as JQueryElement | null,
    $liveRegion: $('<span class="visually-hidden" role="status"></span>'),

    visible: false,

    dragger: null as any,

    desiredWidth: null as number | null,
    desiredHeight: null as number | null,
    resizeDragger: null as any,
    resizeStartWidth: null as number | null,
    resizeStartHeight: null as number | null,

    init: function (
      container?: ElementOrJQuery | ModalSettings,
      settings?: ModalSettings
    ): void {
      // Param mapping
      if (typeof settings === 'undefined' && $.isPlainObject(container)) {
        // (settings)
        settings = container as ModalSettings;
        container = null;
      }

      this.setSettings(settings, Garnish.Modal.defaults);

      // Create the shade
      this.$shade = $('<div class="' + this.settings.shadeClass + '"/>');

      // If the container is already set, drop the shade below it.
      if (container) {
        this.$shade.insertBefore(container as any);
      } else {
        this.$shade.appendTo(Garnish.$bod);
      }

      if (container) {
        this.setContainer(container as ElementOrJQuery);
        Garnish.addModalAttributes(container as any);

        if (this.settings.autoShow) {
          this.show();
        }
      }

      if (this.settings.triggerElement) {
        this.$triggerElement = $(this.settings.triggerElement as any);
      } else {
        this.$triggerElement = Garnish.getFocusedElement();
      }

      (Garnish.Modal as any).instances.push(this);
    },

    addLiveRegion: function (): void {
      if (!this.$container) return;

      this.$liveRegion.appendTo(this.$container);
    },

    setContainer: function (container: ElementOrJQuery): void {
      this.$container = $(container as any);

      // Is this already a modal?
      const existingModal = this.$container.data('modal') as ModalInterface;
      if (existingModal) {
        console.warn('Double-instantiating a modal on an element');
        existingModal.destroy();
      }

      this.$container.data('modal', this);

      if (this.settings.draggable) {
        this.dragger = new Garnish.DragMove(this.$container, {
          handle: this.settings.dragHandleSelector
            ? this.$container.find(this.settings.dragHandleSelector)
            : this.$container,
        });
      }

      if (this.settings.resizable) {
        const $resizeDragHandle = $('<div class="resizehandle"/>')
          .appendTo(this.$container)
          .append(ResizeHandle);

        this.resizeDragger = new Garnish.BaseDrag($resizeDragHandle, {
          onDragStart: this._handleResizeStart.bind(this),
          onDrag: this._handleResize.bind(this),
        });
      }

      this.addLiveRegion();

      this.addListener(
        this.$container,
        'click',
        function (ev: JQuery.ClickEvent) {
          ev.stopPropagation();
        }
      );

      // Show it if we're late to the party
      if (this.visible) {
        this.show();
      }
    },

    show: function (): void {
      // Close other modals as needed
      if (
        this.settings.closeOtherModals &&
        (Garnish.Modal as any).visibleModal &&
        (Garnish.Modal as any).visibleModal !== this
      ) {
        (Garnish.Modal as any).visibleModal.hide();
      }

      if (this.$container) {
        // Move it to the end of <body> so it gets the highest sub-z-index
        this.$shade!.appendTo(Garnish.$bod).velocity('stop');
        this.$container.appendTo(Garnish.$bod).velocity('stop');

        this.$container.show();
        this.updateSizeAndPosition();

        this.$shade!.velocity('fadeIn', {
          duration: 50,
          complete: function (this: ModalInterface) {
            this.$container!.velocity('fadeIn', {
              complete: function (this: ModalInterface) {
                this.updateSizeAndPosition();
                Garnish.setFocusWithin(this.$container!);
                this.onFadeIn();
              }.bind(this),
            });
          }.bind(this),
        });

        if (this.settings.hideOnShadeClick) {
          this.addListener(this.$shade!, 'click', 'hide');
        }

        // Add focus trap
        Garnish.trapFocusWithin(this.$container);

        this.addListener(Garnish.$win, 'resize', '_handleWindowResize');
      }

      this.enable();

      if (!this.visible) {
        this.visible = true;
        (Garnish.Modal as any).visibleModal = this;

        Garnish.uiLayerManager.addLayer(this.$container!);
        Garnish.hideModalBackgroundLayers();

        if (this.settings.hideOnEsc) {
          Garnish.uiLayerManager.registerShortcut(Garnish.ESC_KEY, () => {
            this.trigger('escape');
            this.hide();
          });
        }

        Garnish.$bod.addClass('no-scroll');
        this.onShow();
      }
    },

    onShow: function (): void {
      this.trigger('show');
      this.settings.onShow();
    },

    quickShow: function (): void {
      this.show();

      if (this.$container) {
        this.$container.velocity('stop');
        this.$container.show().css('opacity', 1);

        this.$shade!.velocity('stop');
        this.$shade!.show().css('opacity', 1);
      }
    },

    hide: function (ev?: JQuery.Event): void {
      if (!this.visible) {
        return;
      }

      this.disable();

      if (ev) {
        ev.stopPropagation();
      }

      if (this.$container) {
        this.$container
          .velocity('stop')
          .velocity('fadeOut', {duration: Garnish.FX_DURATION});
        this.$shade!.velocity('stop').velocity('fadeOut', {
          duration: Garnish.FX_DURATION,
          complete: this.onFadeOut.bind(this),
        });

        if (this.settings.hideOnShadeClick) {
          this.removeListener(this.$shade!, 'click');
        }

        this.removeListener(Garnish.$win, 'resize');
      }

      let $focusTarget = this.$triggerElement;

      // Check for visibility of trigger
      if ($focusTarget?.is(':hidden')) {
        const $disclosure = $focusTarget.closest('.menu--disclosure');
        if ($disclosure.length) {
          const menuId = $disclosure.attr('id');
          $focusTarget = $(`[aria-controls="${menuId}"]`);
        } else {
          $focusTarget = null;
        }
      }

      if ($focusTarget?.length) {
        $focusTarget.focus();
      }

      this.visible = false;
      Garnish.$bod.removeClass('no-scroll');
      (Garnish.Modal as any).visibleModal = null;
      Garnish.uiLayerManager.removeLayer();
      Garnish.resetModalBackgroundLayerVisibility();
      this.onHide();
    },

    onHide: function (): void {
      this.trigger('hide');
      this.settings.onHide();
    },

    quickHide: function (): void {
      this.hide();

      if (this.$container) {
        this.$container.velocity('stop');
        this.$container.css('opacity', 0).hide();

        this.$shade!.velocity('stop');
        this.$shade!.css('opacity', 0).hide();

        this.onFadeOut();
      }
    },

    updateSizeAndPosition: function (): void {
      if (!this.$container) {
        return;
      }

      this.$container.css({
        width: this.desiredWidth ? Math.max(this.desiredWidth, 200) : '',
        height: this.desiredHeight ? Math.max(this.desiredHeight, 200) : '',
        'min-width': '',
        'min-height': '',
      });

      // Set the width first so that the height can adjust for the width
      const windowWidth = Garnish.$win.width()!;
      const width = Math.min(
        this.getWidth(),
        windowWidth - this.settings.minGutter * 2
      );

      this.$container.css({
        width: width,
        'min-width': width,
        left: Math.round((windowWidth - width) / 2),
      });

      // Now set the height
      const windowHeight = Garnish.$win.height()!;
      const height = Math.min(
        this.getHeight(),
        windowHeight - this.settings.minGutter * 2
      );

      this.$container.css({
        height: height,
        'min-height': height,
        top: Math.round((windowHeight - height) / 2),
      });

      this.trigger('updateSizeAndPosition');
    },

    updateBodyHeight: function (): void {
      // This method can be implemented by subclasses
    },

    onFadeIn: function (): void {
      this.trigger('fadeIn');
      this.settings.onFadeIn();
    },

    onFadeOut: function (): void {
      this.trigger('fadeOut');
      this.settings.onFadeOut();
    },

    getHeight: function (): number {
      if (!this.$container) {
        throw new Error(
          'Attempted to get the height of a modal whose container has not been set.'
        );
      }

      if (!this.visible) {
        this.$container.show();
      }

      const height = this.$container.outerHeight()!;

      if (!this.visible) {
        this.$container.hide();
      }

      return height;
    },

    getWidth: function (): number {
      if (!this.$container) {
        throw new Error(
          'Attempted to get the width of a modal whose container has not been set.'
        );
      }

      if (!this.visible) {
        this.$container.show();
      }

      // Chrome might be 1px shy here for some reason
      const width = this.$container.outerWidth()! + 1;

      if (!this.visible) {
        this.$container.hide();
      }

      return width;
    },

    _handleWindowResize: function (ev: JQuery.ResizeEvent): void {
      // ignore propagated resize events
      if (ev.target === window) {
        this.updateSizeAndPosition();
      }
    },

    _handleResizeStart: function (): void {
      this.resizeStartWidth = this.getWidth();
      this.resizeStartHeight = this.getHeight();
    },

    _handleResize: function (): void {
      if (Garnish.ltr) {
        this.desiredWidth =
          this.resizeStartWidth! + this.resizeDragger.mouseDistX * 2;
      } else {
        this.desiredWidth =
          this.resizeStartWidth! - this.resizeDragger.mouseDistX * 2;
      }

      this.desiredHeight =
        this.resizeStartHeight! + this.resizeDragger.mouseDistY * 2;

      this.updateSizeAndPosition();
    },

    /**
     * Destroy
     */
    destroy: function (): void {
      if (this.$container) {
        this.$container.removeData('modal').remove();
      }

      if (this.$shade) {
        this.$shade.remove();
      }

      if (this.dragger) {
        this.dragger.destroy();
      }

      if (this.resizeDragger) {
        this.resizeDragger.destroy();
      }

      (Garnish.Modal as any).instances = (
        Garnish.Modal as any
      ).instances.filter((o: ModalInterface) => o !== this);

      this.base();
    },
  },
  {
    relativeElemPadding: 8,
    defaults: {
      autoShow: true,
      draggable: false,
      dragHandleSelector: null,
      resizable: false,
      minGutter: 10,
      onShow: $.noop,
      onHide: $.noop,
      onFadeIn: $.noop,
      onFadeOut: $.noop,
      closeOtherModals: false,
      hideOnEsc: true,
      hideOnShadeClick: true,
      triggerElement: null,
      shadeClass: 'modal-shade',
    } as ModalSettings,

    /**
     * @type {ModalInterface[]}
     */
    instances: [] as ModalInterface[],

    /**
     * @type {ModalInterface | null}
     */
    visibleModal: null as ModalInterface | null,
  }
);
