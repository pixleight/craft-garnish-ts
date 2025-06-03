import Garnish from './Garnish';
import Base from './Base';
import $ from 'jquery';
import type {
  HUDInterface,
  HUDSettings,
  JQueryElement,
  ElementOrJQuery,
} from './types';

/**
 * HUD
 */
export default Base.extend<HUDInterface>(
  {
    $trigger: null,
    $fixedTriggerParent: null,
    $hud: null,
    $tip: null,
    $body: null,
    $header: null,
    $footer: null,
    $mainContainer: null,
    $main: null,
    $shade: null,
    $nextFocusableElement: null,

    showing: false,
    orientation: null,

    updatingSizeAndPosition: false,
    windowWidth: null,
    windowHeight: null,
    scrollTop: null,
    scrollLeft: null,
    mainWidth: null,
    mainHeight: null,

    /**
     * Constructor
     *
     * @param {jQuery|HTMLElement} trigger
     * @param {jQuery|HTMLElement|string} [bodyContents]
     * @param {Object} [settings]
     */
    init(
      trigger: ElementOrJQuery,
      bodyContents: string | ElementOrJQuery | Record<string, any> = '',
      settings: HUDSettings = {}
    ): void {
      this.$trigger = $(trigger);

      if ($.isPlainObject(bodyContents)) {
        // (trigger, settings)
        settings = bodyContents as HUDSettings;
        bodyContents = '';
      }

      this.setSettings(settings, (Garnish as any).HUD.defaults);
      this.on('show', this.settings.onShow);
      this.on('hide', this.settings.onHide);
      this.on('submit', this.settings.onSubmit);

      this.$trigger.attr('aria-expanded', 'false');

      if (typeof (Garnish as any).HUD.activeHUDs === 'undefined') {
        (Garnish as any).HUD.activeHUDs = {};
      }

      if (this.settings.withShade) {
        this.$shade = $('<div/>', {class: this.settings.shadeClass});
      }
      this.$hud = $('<div/>', {class: this.settings.hudClass}).data(
        'hud',
        this
      );
      this.$tip = $('<div/>', {class: this.settings.tipClass}).appendTo(
        this.$hud
      );
      this.$body = $('<form/>', {class: this.settings.bodyClass}).appendTo(
        this.$hud
      );
      this.$mainContainer = $('<div/>', {
        class: this.settings.mainContainerClass,
      }).appendTo(this.$body);
      this.$main = $('<div/>', {class: this.settings.mainClass}).appendTo(
        this.$mainContainer
      );

      this.updateBody(bodyContents as string | ElementOrJQuery);

      // See if the trigger is fixed
      let $parent = this.$trigger;

      do {
        if ($parent.css('position') === 'fixed') {
          this.$fixedTriggerParent = $parent;
          break;
        }

        $parent = $parent.offsetParent();
      } while ($parent.length && $parent.prop('nodeName') !== 'HTML');

      if (this.$fixedTriggerParent) {
        this.$hud.css('position', 'fixed');
      } else {
        this.$hud.css('position', 'absolute');
      }

      this.addListener(this.$body, 'submit', '_handleSubmit');

      if (this.settings.withShade && this.settings.hideOnShadeClick) {
        this.addListener(this.$shade, 'tap,click', 'hide');
      }

      if (this.settings.closeBtn) {
        this.addListener(this.settings.closeBtn, 'activate', 'hide');
      }

      this.addListener(
        (Garnish as any).$win,
        'resize',
        'updateSizeAndPosition'
      );
      if (!this.$fixedTriggerParent) {
        this.addListener(
          (Garnish as any).$scrollContainer,
          'scroll',
          'updateSizeAndPosition'
        );
      }
      if (this.settings.listenToMainResize) {
        this.addListener(this.$main, 'resize', 'updateSizeAndPosition');
      }

      // When the menu is expanded, tabbing on the trigger should move focus into it
      this.addListener(this.$trigger, 'keydown', (ev: JQuery.KeyDownEvent) => {
        if (
          ev.keyCode === (Garnish as any).TAB_KEY &&
          !ev.shiftKey &&
          this.showing
        ) {
          const $focusableElement = (Garnish as any)
            .getKeyboardFocusableElements(this.$hud)
            .first();
          if ($focusableElement.length) {
            ev.preventDefault();
            $focusableElement.focus();
          }
        }
      });

      // Add listener to manage focus
      this.addListener(
        this.$hud,
        'keydown',
        function (this: HUDInterface, event: JQuery.KeyDownEvent) {
          const {keyCode} = event;

          if (keyCode !== (Garnish as any).TAB_KEY) return;

          const $focusableElements = (
            Garnish as any
          ).getKeyboardFocusableElements(this.$hud);
          const index = $focusableElements.index(event.target);

          if (index === 0 && event.shiftKey) {
            event.preventDefault();
            this.$trigger!.focus();
          } else if (
            index === $focusableElements.length - 1 &&
            !event.shiftKey &&
            this.$nextFocusableElement
          ) {
            event.preventDefault();
            this.$nextFocusableElement.focus();
          }
        }
      );

      if (this.settings.showOnInit) {
        // Hide the HUD until it gets positioned
        this.$hud.css('opacity', 0);
        this.show();
        this.$hud.css('opacity', 1);
      } else {
        this.$hud.appendTo((Garnish as any).$bod);
        this.hideContainer();
      }

      (Garnish as any).HUD.instances.push(this);
    },

    /**
     * Update the body contents
     */
    updateBody(bodyContents: string | ElementOrJQuery): void {
      // Cleanup
      this.$main!.html('');

      if (this.$header) {
        this.$hud!.removeClass('has-header');
        this.$header.remove();
        this.$header = null;
      }

      if (this.$footer) {
        this.$hud!.removeClass('has-footer');
        this.$footer.remove();
        this.$footer = null;
      }

      // Append the new body contents
      this.$main!.append(bodyContents);

      // Look for a header and footer
      const $header = this.$main!.find(
        '.' + this.settings.headerClass + ':first'
      );
      const $footer = this.$main!.find(
        '.' + this.settings.footerClass + ':first'
      );

      if ($header.length) {
        this.$header = $header.insertBefore(this.$mainContainer);
        this.$hud!.addClass('has-header');
      }

      if ($footer.length) {
        this.$footer = $footer.insertAfter(this.$mainContainer);
        this.$hud!.addClass('has-footer');
      }
    },

    /**
     * Show
     */
    show(ev?: Event): void {
      if (ev && ev.stopPropagation) {
        ev.stopPropagation();
      }

      if (this.showing) {
        return;
      }

      if (this.settings.closeOtherHUDs) {
        for (const hudID in (Garnish as any).HUD.activeHUDs) {
          if (!(Garnish as any).HUD.activeHUDs.hasOwnProperty(hudID)) {
            continue;
          }
          (Garnish as any).HUD.activeHUDs[hudID].hide();
        }
      }

      // Blur the active element, if there is one, to prevent the page from jumping
      if (document.activeElement !== document.body) {
        $(document.activeElement).blur();
      }

      // Move it to the end of <body> so it gets the highest sub-z-index
      if (this.settings.withShade) {
        this.$shade!.appendTo((Garnish as any).$bod);
        this.$shade!.show();
      }

      this.$hud!.appendTo((Garnish as any).$bod);
      this.$trigger!.attr('aria-expanded', 'true');
      this.showContainer();

      this.showing = true;
      (Garnish as any).HUD.activeHUDs[this._namespace] = this;

      (Garnish as any).uiLayerManager.addLayer(this.$hud);

      if (this.settings.hideOnEsc) {
        (Garnish as any).uiLayerManager.registerShortcut(
          (Garnish as any).ESC_KEY,
          this.hide.bind(this)
        );
      }

      // Find the next focusable element in the DOM after the trigger.
      // Shift-tabbing on it should take focus back into the container.
      const $focusableElements = (Garnish as any).$bod.find(':focusable');
      const triggerIndex = $focusableElements.index(this.$trigger![0]);
      if (triggerIndex !== -1 && $focusableElements.length > triggerIndex + 1) {
        this.$nextFocusableElement = $focusableElements.eq(triggerIndex + 1);
        this.addListener(
          this.$nextFocusableElement,
          'keydown',
          (ev: JQuery.KeyDownEvent) => {
            if (ev.keyCode === (Garnish as any).TAB_KEY && ev.shiftKey) {
              const $focusableElement = (Garnish as any)
                .getKeyboardFocusableElements(this.$hud)
                .last();
              if ($focusableElement.length) {
                ev.preventDefault();
                $focusableElement.focus();
              }
            }
          }
        );
      }

      this.onShow();
      this.enable();

      if (this.updateRecords()) {
        // Prevent the browser from jumping
        this.$hud!.css('top', (Garnish as any).$scrollContainer.scrollTop());

        this.updateSizeAndPosition(true);
      }
    },

    showContainer(): void {
      this.$hud!.show();
    },

    onShow(): void {
      this.trigger('show');
    },

    updateRecords(): boolean {
      let changed = false;

      changed =
        this.windowWidth !==
          (this.windowWidth = (Garnish as any).$win.width()) || changed;
      changed =
        this.windowHeight !==
          (this.windowHeight = (Garnish as any).$win.height()) || changed;
      changed =
        this.scrollTop !==
          (this.scrollTop = (Garnish as any).$scrollContainer.scrollTop()) ||
        changed;
      changed =
        this.scrollLeft !==
          (this.scrollLeft = (Garnish as any).$scrollContainer.scrollLeft()) ||
        changed;
      changed =
        this.mainWidth !== (this.mainWidth = this.$main!.outerWidth()) ||
        changed;
      changed =
        this.mainHeight !== (this.mainHeight = this.$main!.outerHeight()) ||
        changed;

      const $scrollParent = this.$trigger!.scrollParent();
      if ($scrollParent.get(0) !== (Garnish as any).$scrollContainer.get(0)) {
        changed =
          this.spWidth !== (this.spWidth = $scrollParent.width()) || changed;
        changed =
          this.spHeight !== (this.spHeight = $scrollParent.height()) || changed;
        changed =
          this.spScrollTop !== (this.spScrollTop = $scrollParent.scrollTop()) ||
          changed;
        changed =
          this.spScrollLeft !==
            (this.spScrollLeft = $scrollParent.scrollLeft()) || changed;
      }

      return changed;
    },

    updateSizeAndPosition(force?: boolean): void {
      if (
        force === true ||
        (this.updateRecords() && !this.updatingSizeAndPosition)
      ) {
        this.updatingSizeAndPosition = true;
        (Garnish as any).requestAnimationFrame(
          this.updateSizeAndPositionInternal.bind(this)
        );
      }
    },

    updateSizeAndPositionInternal(): void {
      let triggerWidth: number,
        triggerHeight: number,
        triggerOffset: JQuery.Coordinates & {right: number; bottom: number},
        windowScrollLeft: number,
        windowScrollTop: number,
        scrollContainerTriggerOffset: any,
        scrollContainerScrollLeft: number,
        scrollContainerScrollTop: number,
        hudBodyWidth: number,
        hudBodyHeight: number;

      // Get the window sizes and trigger offset

      windowScrollLeft = (Garnish as any).$win.scrollLeft();
      windowScrollTop = (Garnish as any).$win.scrollTop();

      // Get the trigger's dimensions
      triggerWidth = this.$trigger!.outerWidth()!;
      triggerHeight = this.$trigger!.outerHeight()!;

      // Get the offsets for each side of the trigger element
      triggerOffset = this.$trigger!.offset()! as JQuery.Coordinates & {
        right: number;
        bottom: number;
      };

      if (this.$fixedTriggerParent) {
        triggerOffset.left -= windowScrollLeft;
        triggerOffset.top -= windowScrollTop;

        scrollContainerTriggerOffset = triggerOffset;

        windowScrollLeft = 0;
        windowScrollTop = 0;
        scrollContainerScrollLeft = 0;
        scrollContainerScrollTop = 0;
      } else {
        scrollContainerTriggerOffset = (Garnish as any).getOffset(
          this.$trigger
        );

        scrollContainerScrollLeft = (
          Garnish as any
        ).$scrollContainer.scrollLeft();
        scrollContainerScrollTop = (
          Garnish as any
        ).$scrollContainer.scrollTop();
      }

      triggerOffset.right = triggerOffset.left + triggerWidth;
      triggerOffset.bottom = triggerOffset.top + triggerHeight;

      scrollContainerTriggerOffset.right =
        scrollContainerTriggerOffset.left + triggerWidth;
      scrollContainerTriggerOffset.bottom =
        scrollContainerTriggerOffset.top + triggerHeight;

      // Get the HUD dimensions
      this.$hud!.css({
        width: '',
      });

      this.$mainContainer!.css({
        height: '',
        'overflow-x': '',
        'overflow-y': '',
      });

      hudBodyWidth = this.$body!.width()!;
      hudBodyHeight = this.$body!.height()!;

      // Determine the best orientation for the HUD

      // Find the actual available top/right/bottom/left clearances
      const clearances = {
        bottom:
          this.windowHeight! +
          scrollContainerScrollTop -
          scrollContainerTriggerOffset.bottom,
        top: scrollContainerTriggerOffset.top - scrollContainerScrollTop,
        right:
          this.windowWidth! +
          scrollContainerScrollLeft -
          scrollContainerTriggerOffset.right,
        left: scrollContainerTriggerOffset.left - scrollContainerScrollLeft,
      };

      // Find the first position that has enough room
      this.orientation = null;

      for (let i = 0; i < this.settings.orientations!.length; i++) {
        const orientation = this.settings.orientations![i];
        const relevantSize =
          orientation === 'top' || orientation === 'bottom'
            ? hudBodyHeight
            : hudBodyWidth;

        if (
          clearances[orientation as keyof typeof clearances] -
            (this.settings.windowSpacing! + this.settings.triggerSpacing!) >=
          relevantSize
        ) {
          // This is the first orientation that has enough room in order of preference, so we'll go with this
          this.orientation = orientation;
          break;
        }

        if (
          !this.orientation ||
          clearances[orientation as keyof typeof clearances] >
            clearances[this.orientation as keyof typeof clearances]
        ) {
          // Use this as a fallback as it's the orientation with the most clearance so far
          this.orientation = orientation;
        }
      }

      // Just in case...
      if (
        !this.orientation ||
        $.inArray(this.orientation, ['bottom', 'top', 'right', 'left']) === -1
      ) {
        this.orientation = 'bottom';
      }

      // Update the tip class
      if (this.tipClass) {
        this.$tip!.removeClass(this.tipClass);
      }

      this.tipClass =
        this.settings.tipClass +
        '-' +
        (Garnish as any).HUD.tipClasses[this.orientation];
      this.$tip!.addClass(this.tipClass);

      // Make sure the HUD body is within the allowed size

      let maxHudBodyWidth: number, maxHudBodyHeight: number;

      if (this.orientation === 'top' || this.orientation === 'bottom') {
        maxHudBodyWidth = this.windowWidth! - this.settings.windowSpacing! * 2;
        maxHudBodyHeight =
          clearances[this.orientation as keyof typeof clearances] -
          this.settings.windowSpacing! -
          this.settings.triggerSpacing!;
      } else {
        maxHudBodyWidth =
          clearances[this.orientation as keyof typeof clearances] -
          this.settings.windowSpacing! -
          this.settings.triggerSpacing!;
        maxHudBodyHeight =
          this.windowHeight! - this.settings.windowSpacing! * 2;
      }

      if (maxHudBodyWidth < this.settings.minBodyWidth!) {
        maxHudBodyWidth = this.settings.minBodyWidth!;
      }

      if (maxHudBodyHeight < this.settings.minBodyHeight!) {
        maxHudBodyHeight = this.settings.minBodyHeight!;
      }

      if (
        hudBodyWidth > maxHudBodyWidth ||
        hudBodyWidth < this.settings.minBodyWidth!
      ) {
        if (hudBodyWidth > maxHudBodyWidth) {
          hudBodyWidth = maxHudBodyWidth;
        } else {
          hudBodyWidth = this.settings.minBodyWidth!;
        }

        this.$hud!.width(hudBodyWidth);

        // Is there any overflow now?
        if (this.mainWidth! > maxHudBodyWidth) {
          this.$mainContainer!.css('overflow-x', 'scroll');
        }

        // The height may have just changed
        hudBodyHeight = this.$body!.height()!;
      }

      if (
        hudBodyHeight > maxHudBodyHeight ||
        hudBodyHeight < this.settings.minBodyHeight!
      ) {
        if (hudBodyHeight > maxHudBodyHeight) {
          hudBodyHeight = maxHudBodyHeight;
        } else {
          hudBodyHeight = this.settings.minBodyHeight!;
        }

        let mainHeight = hudBodyHeight;

        if (this.$header) {
          mainHeight -= this.$header.outerHeight()!;
        }

        if (this.$footer) {
          mainHeight -= this.$footer.outerHeight()!;
        }

        this.$mainContainer!.height(mainHeight);

        // Is there any overflow now?
        if (this.mainHeight! > mainHeight) {
          this.$mainContainer!.css('overflow-y', 'scroll');
        }
      }

      // Set the HUD/tip positions
      let triggerCenter: number, left: number, top: number;

      this.$hud!.css({
        'border-top-left-radius': '',
        'border-top-right-radius': '',
        'border-bottom-right-radius': '',
        'border-bottom-left-radius': '',
      });
      const borderRadius = parseInt(this.$hud!.css('border-radius'));

      if (this.orientation === 'top' || this.orientation === 'bottom') {
        // Center the HUD horizontally
        const maxLeft =
          this.windowWidth! +
          windowScrollLeft -
          (hudBodyWidth + this.settings.windowSpacing!);
        const minLeft = windowScrollLeft + this.settings.windowSpacing!;
        triggerCenter = triggerOffset.left + Math.round(triggerWidth / 2);
        left = triggerCenter - Math.round(hudBodyWidth / 2);

        if (left > maxLeft) {
          left = maxLeft;
        }
        if (left < minLeft) {
          left = minLeft;
        }

        this.$hud!.css('left', left);

        const tipLeft = (Garnish as any).within(
          triggerCenter - left - this.settings.tipWidth! / 2,
          0,
          hudBodyWidth - this.settings.tipWidth!
        );
        this.$tip!.css({left: tipLeft, top: ''});

        if (this.orientation === 'top') {
          top =
            triggerOffset.top - (hudBodyHeight + this.settings.triggerSpacing!);
          this.$hud!.css('top', top);
        } else {
          top = triggerOffset.bottom + this.settings.triggerSpacing!;
          this.$hud!.css('top', top);
        }

        const adjustRadius = this.orientation === 'top' ? 'bottom' : 'top';
        if (tipLeft < borderRadius) {
          this.$hud!.css(`border-${adjustRadius}-left-radius`, 2);
        } else if (
          tipLeft >
          hudBodyWidth - borderRadius - this.settings.tipWidth!
        ) {
          this.$hud!.css(`border-${adjustRadius}-right-radius`, 2);
        }
      } else {
        // Center the HUD vertically
        const maxTop =
          this.windowHeight! +
          windowScrollTop -
          (hudBodyHeight + this.settings.windowSpacing!);
        const minTop = windowScrollTop + this.settings.windowSpacing!;
        triggerCenter = triggerOffset.top + Math.round(triggerHeight / 2);
        top = triggerCenter - Math.round(hudBodyHeight / 2);

        if (top > maxTop) {
          top = maxTop;
        }
        if (top < minTop) {
          top = minTop;
        }

        this.$hud!.css('top', top);

        const tipTop = (Garnish as any).within(
          triggerCenter - top - this.settings.tipWidth! / 2,
          0,
          hudBodyHeight - this.settings.tipWidth!
        );
        this.$tip!.css({top: tipTop, left: ''});

        if (this.orientation === 'left') {
          left =
            triggerOffset.left - (hudBodyWidth + this.settings.triggerSpacing!);
          this.$hud!.css('left', left);
        } else {
          left = triggerOffset.right + this.settings.triggerSpacing!;
          this.$hud!.css('left', left);
        }

        const adjustRadius = this.orientation === 'left' ? 'right' : 'left';
        if (tipTop < borderRadius) {
          this.$hud!.css(`border-top-${adjustRadius}-radius`, 2);
        } else if (
          tipTop >
          hudBodyHeight - borderRadius - this.settings.tipWidth!
        ) {
          this.$hud!.css(`border-bottom-${adjustRadius}-radius`, 2);
        }
      }

      this.updatingSizeAndPosition = false;
      this.trigger('updateSizeAndPosition');
    },

    /**
     * Hide
     */
    hide(): void {
      if (!this.showing) {
        return;
      }

      this.disable();
      this.$trigger!.attr('aria-expanded', 'false');
      this.hideContainer();

      if (this.settings.withShade) {
        this.$shade!.hide();
      }

      this.showing = false;
      delete (Garnish as any).HUD.activeHUDs[this._namespace];
      (Garnish as any).uiLayerManager.removeLayer();

      if ((Garnish as any).focusIsInside(this.$hud)) {
        this.$trigger!.focus();
      }

      if (this.$nextFocusableElement) {
        this.removeListener(this.$nextFocusableElement, 'keydown');
        this.$nextFocusableElement = null;
      }

      this.onHide();
    },

    hideContainer(): void {
      this.$hud!.hide();
    },

    onHide(): void {
      this.trigger('hide');
    },

    toggle(): void {
      if (this.showing) {
        this.hide();
      } else {
        this.show();
      }
    },

    submit(): void {
      this.onSubmit();
    },

    onSubmit(): void {
      this.trigger('submit');
    },

    _handleSubmit(ev: JQuery.SubmitEvent): void {
      ev.preventDefault();
      this.submit();
    },

    /**
     * Destroy
     */
    destroy(): void {
      if (this.$hud) {
        this.$hud.remove();
      }

      if (this.settings.withShade && this.$shade) {
        this.$shade.remove();
      }

      (Garnish as any).HUD.instances = (Garnish as any).HUD.instances.filter(
        (o: any) => o !== this
      );

      this.base();
    },
  },
  {
    tipClasses: {bottom: 'top', top: 'bottom', right: 'left', left: 'right'},

    defaults: {
      shadeClass: 'hud-shade',
      hudClass: 'hud',
      tipClass: 'tip',
      bodyClass: 'body',
      headerClass: 'hud-header',
      footerClass: 'hud-footer',
      mainContainerClass: 'main-container',
      mainClass: 'main',
      orientations: ['bottom', 'top', 'right', 'left'],
      triggerSpacing: 10,
      windowSpacing: 10,
      tipWidth: 30,
      minBodyWidth: 200,
      minBodyHeight: 0,
      withShade: true,
      onShow: $.noop,
      onHide: $.noop,
      onSubmit: $.noop,
      closeBtn: null,
      listenToMainResize: true,
      showOnInit: true,
      closeOtherHUDs: true,
      hideOnEsc: true,
      hideOnShadeClick: true,
    } as HUDSettings,

    /**
     * @type {Garnish.HUD[]}
     */
    instances: [] as HUDInterface[],
  }
);
