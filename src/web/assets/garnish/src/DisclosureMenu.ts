import Garnish from './Garnish';
import Base from './Base';
import {
  DisclosureMenuInterface,
  DisclosureMenuSettings,
  DisclosureMenuItem,
  JQueryElement,
} from './types';
import $ from 'jquery';

/**
 * Disclosure Widget
 */
export default Base.extend(
  {
    settings: null as DisclosureMenuSettings | null,

    $trigger: null as JQueryElement | null,
    $container: null as JQueryElement | null,
    $alignmentElement: null as JQueryElement | null,
    $nextFocusableElement: null as JQueryElement | null,
    $searchInput: null as JQueryElement | null,

    _viewportWidth: null as number | null,
    _viewportHeight: null as number | null,
    _viewportScrollLeft: null as number | null,
    _viewportScrollTop: null as number | null,

    _alignmentElementOffset: null as JQuery.Coordinates | null,
    _alignmentElementWidth: null as number | null,
    _alignmentElementHeight: null as number | null,
    _alignmentElementOffsetRight: null as number | null,
    _alignmentElementOffsetBottom: null as number | null,

    _menuWidth: null as number | null,
    _menuHeight: null as number | null,

    searchStr: '',
    clearSearchStrTimeout: null as number | null,

    /**
     * Constructor
     */
    init: function (
      trigger: string | HTMLElement | JQueryElement,
      settings?: DisclosureMenuSettings
    ): void {
      this.setSettings(settings, Garnish.DisclosureMenu.defaults);

      this.$trigger = $(trigger);

      // Is this already a disclosure button?
      if (this.$trigger.data('trigger')) {
        console.warn('Double-instantiating a disclosure menu on an element');
        return;
      }

      this.$trigger.attr('data-disclosure-trigger', 'true');

      const containerId = this.$trigger.attr('aria-controls');
      this.$container = $('#' + containerId);
      if (!this.$container.length) {
        // see if it's the next element
        const $next = this.$trigger.next();
        if ($next.is(`#${containerId}`)) {
          this.$container = $next;
        } else {
          throw 'No disclosure container found.';
        }
      }

      this.$trigger.data('disclosureMenu', this);
      this.$container.data('disclosureMenu', this);

      // for BC
      this.$trigger.data('trigger', this);
      this.$container.data('trigger', this);

      // Get and store expanded state from trigger
      const expanded = this.$trigger.attr('aria-expanded');

      // If no expanded state exists on trigger, add for a11y
      if (!expanded) {
        this.$trigger.attr('aria-expanded', 'false');
      }

      // Capture additional alignment element
      const alignmentSelector = this.$container.data('align-to');
      if (alignmentSelector) {
        this.$alignmentElement = this.$trigger.find(alignmentSelector).first();
      } else {
        this.$alignmentElement = this.$trigger;
      }

      this.$container.appendTo(Garnish.$bod);
      // if trigger is in a slideout, we need to initialise UI elements
      if (this.$trigger.parents('.slideout').length > 0) {
        (Craft as any).initUiElements(this.$container);
      }
      this.addDisclosureMenuEventListeners();

      // add a search input?
      this.settings.withSearchInput =
        this.settings.withSearchInput ||
        Garnish.hasAttr(this.$container, 'data-with-search-input');
      if (this.settings.withSearchInput) {
        this.addSearchInput();
      }

      Garnish.DisclosureMenu.instances.push(this);
    },

    addSearchInput: function (): void {
      const $outerContainer = $('<div/>', {
        class: 'search-container',
      }).prependTo(this.$container);
      const $innerContainer = $('<div/>', {
        class: 'texticon search icon clearable',
      }).appendTo($outerContainer);
      this.$searchInput = $('<input/>', {
        class: 'fullwidth text',
        type: 'text',
        inputmode: 'search',
        autocomplete: 'off',
        placeholder: (Craft as any).t('app', 'Search'),
      }).appendTo($innerContainer);
      const $clearBtn = $('<div/>', {
        class: 'clear-btn hidden',
        title: (Craft as any).t('app', 'Clear'),
        'aria-label': (Craft as any).t('app', 'Clear'),
      }).appendTo($innerContainer);

      this.$searchInput.on('input', (ev: JQuery.Event) => {
        const val = (this.$searchInput!.val() as string)
          .toLowerCase()
          .replace(/['"]/g, '');
        const $options = this.$container.find('li');

        if (val) {
          $clearBtn.removeClass('hidden');
          let $matches = $();
          $options.each((i, option) => {
            const $option = $(option);
            if ($option.text().toLowerCase().includes(val)) {
              $matches = $matches.add($option);
            }
          });
          $matches.removeClass('filtered');
          $options.not($matches).addClass('filtered');
        } else {
          $clearBtn.addClass('hidden');
          $options.removeClass('filtered');
        }

        this.setContainerPosition();
      });

      this.addListener(
        this.$searchInput,
        'keydown',
        (ev: JQuery.KeyDownEvent) => {
          switch (ev.keyCode) {
            case Garnish.ESC_KEY:
              this.$searchInput!.val('').trigger('input');
              break;
            case Garnish.RETURN_KEY:
              // they most likely don't want to submit the form from here
              ev.preventDefault();
              break;
          }
        }
      );

      this.addListener($clearBtn, 'click', () => {
        this.$searchInput!.val('').trigger('input').focus();
      });
    },

    addDisclosureMenuEventListeners: function (): void {
      this.addListener(
        this.$trigger,
        'mousedown',
        (ev: JQuery.MouseDownEvent) => {
          ev.stopPropagation();
          ev.preventDefault();

          // Let the other disclosure menus know about it, at least
          for (const disclosureMenu of Garnish.DisclosureMenu.instances) {
            if (disclosureMenu !== this) {
              disclosureMenu.handleMousedown(ev);
            }
          }
        }
      );

      this.addListener(this.$trigger, 'mouseup', (ev: JQuery.MouseUpEvent) => {
        ev.stopPropagation();
        ev.preventDefault();
      });

      this.addListener(this.$trigger, 'click', (ev: JQuery.ClickEvent) => {
        ev.stopPropagation();
        ev.preventDefault();
        this.handleTriggerClick();
      });

      this.addListener(
        this.$container,
        'keydown',
        (ev: JQuery.KeyDownEvent) => {
          this.handleKeypress(ev);
        }
      );

      this.addListener(
        Garnish.$doc,
        'mousedown',
        (ev: JQuery.MouseDownEvent) => {
          this.handleMousedown(ev);
        }
      );

      // When the menu is expanded, tabbing on the trigger should move focus into it
      this.addListener(this.$trigger, 'keydown', (ev: JQuery.KeyDownEvent) => {
        if (
          ev.keyCode === Garnish.TAB_KEY &&
          !ev.shiftKey &&
          this.isExpanded()
        ) {
          const $focusableElement = this.$container.find(':focusable:first');
          if ($focusableElement.length) {
            ev.preventDefault();
            $focusableElement.focus();
          }
        }
      });
    },

    focusElement: function (
      component: 'prev' | 'next' | HTMLElement | JQueryElement
    ): void {
      if (component instanceof HTMLElement || component instanceof $) {
        let $component = $(component);
        if (!$component.is(':focusable')) {
          $component = $component.find(':focusable');
        }
        $component.focus();
        return;
      }

      const currentFocus = $(':focus');

      const focusable = this.$container.find(':focusable');

      const currentIndex = focusable.index(currentFocus);
      let newIndex: number;

      if (component === 'prev') {
        newIndex = currentIndex - 1;
      } else {
        newIndex = currentIndex + 1;
      }

      if (newIndex >= 0 && newIndex < focusable.length) {
        const elementToFocus = focusable[newIndex];
        elementToFocus.focus();
      }
    },

    handleMousedown: function (event: JQuery.Event): void {
      const newTarget = event.target;
      const triggerButton = $(newTarget).closest('[data-disclosure-trigger]');
      const newTargetIsInsideDisclosure =
        this.$container[0] === event.target ||
        this.$container!.has(newTarget).length > 0;

      // If click target matches trigger element or disclosure child, do nothing
      if ($(triggerButton).is(this.$trigger) || newTargetIsInsideDisclosure) {
        return;
      }

      this.hide();
    },

    handleKeypress: function (ev: JQuery.KeyDownEvent): void {
      if (Garnish.isCtrlKeyPressed(ev)) {
        return;
      }

      const keyCode = ev.keyCode;

      switch (keyCode) {
        case Garnish.RIGHT_KEY:
        case Garnish.DOWN_KEY:
          ev.preventDefault();
          this.focusElement('next');
          return;
        case Garnish.LEFT_KEY:
        case Garnish.UP_KEY:
          ev.preventDefault();
          this.focusElement('prev');
          return;
        case Garnish.TAB_KEY:
          const $focusableElements = this.$container.find(':focusable');
          const index = $focusableElements.index(ev.target);

          if (index === 0 && ev.shiftKey) {
            ev.preventDefault();
            this.$trigger!.focus();
          } else if (
            index === $focusableElements.length - 1 &&
            !ev.shiftKey &&
            this.$nextFocusableElement
          ) {
            ev.preventDefault();
            this.$nextFocusableElement.focus();
          }
          return;
      }

      if (
        ev.target.nodeName !== 'INPUT' &&
        ev.key &&
        (ev.key.match(/^[^ ]$/) || (this.searchStr.length && ev.key === ' '))
      ) {
        // show the menu and set visual focus to the first matching option
        let $option: JQueryElement | undefined;

        // see if there's a matching option
        this.searchStr += ev.key.toLowerCase();
        const $options = this.$container.find('li');
        for (let i = 0; i < $options.length; i++) {
          const $o = $options.eq(i);
          if (typeof $o.data('searchText') === 'undefined') {
            // clone without nested SVGs
            const $clone = $o.clone();
            $clone.find('svg').remove();
            $o.data('searchText', $clone.text().toLowerCase().trimStart());
          }
          if ($o.data('searchText').startsWith(this.searchStr)) {
            $option = $o;
            break;
          }
        }

        if ($option && $option.length) {
          this.focusElement($option);
        }

        // update the timeout
        if (this.clearSearchStrTimeout) {
          clearTimeout(this.clearSearchStrTimeout);
        }
        this.clearSearchStrTimeout = setTimeout(() => {
          this.clearSearchStr();
        }, 1000);
      }
    },

    isExpanded: function (): boolean {
      const isExpanded = this.$trigger!.attr('aria-expanded');
      return isExpanded === 'true';
    },

    handleTriggerClick: function (): void {
      if (!this.isExpanded()) {
        this.show();
      } else {
        this.hide();
      }
    },

    show: function (): void {
      if (this.isExpanded() || this.$trigger!.hasClass('disabled')) {
        return;
      }

      this.trigger('beforeShow');

      // Move the menu to the end of the DOM
      this.$container.appendTo(Garnish.$bod);

      this.setContainerPosition();
      this.addListener(
        Garnish.$scrollContainer,
        'scroll',
        'setContainerPosition'
      );
      const $scrollParent = this.$trigger!.scrollParent();
      if ($scrollParent.get(0) !== document.body) {
        this.addListener($scrollParent, 'scroll', 'setContainerPosition');
      }
      this.addListener(Garnish.$win, 'resize', 'setContainerPosition');

      this.$container.velocity('stop');
      this.$container.css({
        opacity: 1,
        display: '',
      });

      // In case its default display is set to none
      if (this.$container.css('display') === 'none') {
        this.$container.css('display', 'block');
      }

      // Set ARIA attribute for expanded
      this.$trigger!.attr('aria-expanded', 'true');

      // Focus first focusable element
      const firstFocusableEl = this.$container.find(':focusable')[0];
      if (firstFocusableEl) {
        firstFocusableEl.focus();
      } else {
        this.$container.attr('tabindex', '-1');
        this.$container.focus();
      }

      // Find the next focusable element in the DOM after the trigger.
      // Shift-tabbing on it should take focus back into the container.
      const $focusableElements = Garnish.$bod.find(':focusable');
      const triggerIndex = $focusableElements.index(this.$trigger![0]);
      if (triggerIndex !== -1 && $focusableElements.length > triggerIndex + 1) {
        this.$nextFocusableElement = $focusableElements.eq(triggerIndex + 1);
        this.addListener(
          this.$nextFocusableElement,
          'keydown',
          (ev: JQuery.KeyDownEvent) => {
            if (ev.keyCode === Garnish.TAB_KEY && ev.shiftKey) {
              const $focusableElement = this.$container.find(':focusable:last');
              if ($focusableElement.length) {
                ev.preventDefault();
                $focusableElement.focus();
              }
            }
          }
        );
      }

      this.trigger('show');
      this.clearSearchStr();
      Garnish.uiLayerManager.addLayer(this.$container);
      Garnish.uiLayerManager.registerShortcut(
        Garnish.ESC_KEY,
        function (this: any) {
          this.hide();
        }.bind(this)
      );
    },

    hide: function (): void {
      if (!this.isExpanded()) {
        return;
      }

      this.$container.velocity('fadeOut', {duration: Garnish.FX_DURATION});

      this.$trigger!.attr('aria-expanded', 'false');

      if (this.focusIsInMenu()) {
        this.$trigger!.focus();
      }

      if (this.$nextFocusableElement) {
        this.removeListener(this.$nextFocusableElement, 'keydown');
        this.$nextFocusableElement = null;
      }

      if (this.$searchInput) {
        this.$searchInput.val('').trigger('input');
      }

      this.trigger('hide');
      this.clearSearchStr();
      this.removeListener(Garnish.$scrollContainer, 'scroll');
      this.removeListener(Garnish.$win, 'resize');
      Garnish.uiLayerManager.removeLayer(this.$container);
    },

    focusIsInMenu: function (): boolean {
      if (!this.$container.length) {
        return false;
      }
      const $focusedEl = Garnish.getFocusedElement();
      return $focusedEl.length && $.contains(this.$container[0], $focusedEl[0]);
    },

    setContainerPosition: function (): void {
      this._viewportWidth = Garnish.$win.width()!;
      this._viewportHeight = Garnish.$win.height()!;
      this._viewportScrollLeft = Garnish.$win.scrollLeft()!;
      this._viewportScrollTop = Garnish.$win.scrollTop()!;

      this._alignmentElementOffset = this.$alignmentElement!.offset()!;
      this._alignmentElementWidth = this.$alignmentElement!.outerWidth()!;
      this._alignmentElementHeight = this.$alignmentElement!.outerHeight()!;
      this._alignmentElementOffsetRight =
        this._alignmentElementOffset.left + this._alignmentElementWidth;
      this._alignmentElementOffsetBottom =
        this._alignmentElementOffset.top + this._alignmentElementHeight;

      this.$container.css('minWidth', 0);
      this.$container.css(
        'minWidth',
        this._alignmentElementWidth -
          (this.$container.outerWidth()! - this.$container.width()!)
      );

      this._menuWidth = this.$container.outerWidth()!;
      this._menuHeight = this.$container.outerHeight()!;

      if (this._menuWidth > this._viewportWidth) {
        this.$container.css('maxWidth', this._viewportWidth);
        this._menuWidth = this._viewportWidth;
      }

      // Is there room for the menu below the trigger?
      const topClearance =
        this._alignmentElementOffset.top - this._viewportScrollTop;
      const bottomClearance =
        this._viewportHeight +
        this._viewportScrollTop -
        this._alignmentElementOffsetBottom;

      if (
        this.settings!.position === 'below' ||
        bottomClearance >= this._menuHeight ||
        (topClearance < this._menuHeight && bottomClearance >= topClearance)
      ) {
        this.$container.css({
          top: this._alignmentElementOffsetBottom,
          maxHeight: bottomClearance - this.settings!.windowSpacing!,
        });
      } else {
        this.$container.css({
          top:
            this._alignmentElementOffset.top -
            Math.min(
              this._menuHeight,
              topClearance - this.settings!.windowSpacing!
            ),
          maxHeight: topClearance - this.settings!.windowSpacing!,
        });
      }

      // Figure out how we're aligning it
      let align = this.$container.data('align');

      if (align !== 'left' && align !== 'center' && align !== 'right') {
        align = 'left';
      }

      if (this._menuWidth === this._viewportWidth || align === 'center') {
        this._alignCenter();
      } else {
        // Figure out which options are actually possible
        const rightClearance =
          this._viewportWidth +
          this._viewportScrollLeft -
          (this._alignmentElementOffset.left + this._menuWidth);
        const leftClearance =
          this._alignmentElementOffsetRight - this._menuWidth;

        if (leftClearance < 0 && rightClearance < 0) {
          this._alignCenter();
        } else if (
          (align === 'right' && leftClearance >= 0) ||
          rightClearance < 0
        ) {
          this._alignRight();
        } else {
          this._alignLeft();
        }
      }

      delete this._viewportWidth;
      delete this._viewportHeight;
      delete this._viewportScrollLeft;
      delete this._viewportScrollTop;
      delete this._alignmentElementOffset;
      delete this._alignmentElementWidth;
      delete this._alignmentElementHeight;
      delete this._alignmentElementOffsetRight;
      delete this._alignmentElementOffsetBottom;
      delete this._menuWidth;
      delete this._menuHeight;
    },

    clearSearchStr: function (): void {
      this.searchStr = '';
      if (this.clearSearchStrTimeout) {
        clearTimeout(this.clearSearchStrTimeout);
        this.clearSearchStrTimeout = null;
      }
    },

    isPadded: function (tag: string = 'ul'): boolean {
      return this.$container.children(`${tag}.padded`).length > 0;
    },

    createItem: function (
      item: DisclosureMenuItem | HTMLElement | JQueryElement
    ): HTMLElement {
      if (item instanceof Element && item.nodeType === Node.ELEMENT_NODE) {
        return item as HTMLElement;
      }

      if (item instanceof $) {
        return item[0];
      }

      if (!$.isPlainObject(item)) {
        throw 'Unsupported item configuration.';
      }

      const menuItem = item as DisclosureMenuItem;

      let type: string;
      if (menuItem.type) {
        type = menuItem.type;
      } else if (menuItem.url) {
        type = 'link';
      } else {
        type = 'button';
      }

      const li = document.createElement('li');
      const el = document.createElement(type === 'button' ? 'button' : 'a') as
        | HTMLButtonElement
        | HTMLAnchorElement;

      el.id = menuItem.id || `menu-item-${Math.floor(Math.random() * 1000000)}`;
      el.className = 'menu-item';
      if (menuItem.selected) {
        el.classList.add('sel');
      }
      if (menuItem.destructive) {
        el.classList.add('error');
        el.setAttribute('data-destructive', 'true');
      }
      if (menuItem.disabled) {
        el.classList.add('disabled');
      }
      if (menuItem.action) {
        el.classList.add('formsubmit');
        $(el).formsubmit();
      }
      if (type === 'link') {
        (el as HTMLAnchorElement).href = (Craft as any).getUrl(menuItem.url);
      }
      if (menuItem.icon) {
        if (typeof menuItem.icon === 'string') {
          el.setAttribute('data-icon', menuItem.icon);
          if (menuItem.iconColor) {
            el.classList.add(menuItem.iconColor);
          }
        } else {
          (async () => {
            let icon: Element;
            if (menuItem.icon instanceof Element) {
              icon = menuItem.icon;
            } else if (typeof menuItem.icon === 'function') {
              icon = await menuItem.icon();
            } else {
              throw 'Unsupported icon type';
            }
            const span = document.createElement('span');
            span.className = 'icon';
            if (menuItem.iconColor) {
              span.classList.add(menuItem.iconColor);
            }
            span.append(icon);
            el.prepend(span);
          })();
        }
      }
      if (menuItem.action) {
        el.setAttribute('data-action', menuItem.action);
        el.setAttribute('data-form', 'false');
      }
      if (menuItem.params) {
        el.setAttribute(
          'data-params',
          typeof menuItem.params === 'string'
            ? menuItem.params
            : JSON.stringify(menuItem.params)
        );
      }
      if (menuItem.confirm) {
        el.setAttribute('data-confirm', menuItem.confirm);
      }
      if (menuItem.redirect) {
        el.setAttribute('data-redirect', menuItem.redirect);
      }
      if (menuItem.attributes) {
        for (let name in menuItem.attributes) {
          el.setAttribute(name, menuItem.attributes[name]);
        }
      }
      li.append(el);

      if (menuItem.status) {
        const status = document.createElement('div');
        status.className = `status ${menuItem.status}`;
        el.append(status);
      }

      const label = document.createElement('span');
      label.className = 'menu-item-label';
      if (menuItem.label) {
        label.textContent = menuItem.label;
      } else if (menuItem.html) {
        label.innerHTML = menuItem.html;
      }
      el.append(label);

      if (menuItem.description) {
        const description = document.createElement('div');
        description.className = 'menu-item-description smalltext light';
        description.textContent = menuItem.description;
        el.append(description);
      }

      if (type === 'link') {
        this.addListener(el, 'keydown', (ev: JQuery.KeyDownEvent) => {
          if (ev.keyCode === Garnish.SPACE_KEY) {
            (el as HTMLElement).click();
          }
        });
      }

      this.addListener(el, 'activate', () => {
        if (menuItem.onActivate) {
          menuItem.onActivate();
        } else if (menuItem.callback) {
          menuItem.callback();
        }
        setTimeout(() => {
          this.hide();
        }, 1);
      });

      return li;
    },

    addItem: function (
      item: DisclosureMenuItem,
      ul?: HTMLElement,
      prepend: boolean = false
    ): HTMLElement {
      const li = this.createItem(item);

      if (!ul) {
        ul = this.$container.children('ul').last().get(0) || this.addGroup();
      }

      if (prepend) {
        ul.prepend(li);
      } else {
        ul.append(li);
      }

      const el = li.querySelector('a, button') as HTMLElement;

      // show or hide it (show, in case the UL is already hidden)
      this.toggleItem(el, !item.hidden);

      return el;
    },

    addItems: function (items: DisclosureMenuItem[], ul?: HTMLElement): void {
      for (const item of items) {
        this.addItem(item, ul);
      }
    },

    addHr: function (before?: HTMLElement): HTMLElement {
      const hr = document.createElement('hr');
      if (this.isPadded('hr')) {
        hr.className = 'padded';
      }

      if (before) {
        before.parentNode!.insertBefore(hr, before);
      } else {
        this.$container.append(hr);
      }

      return hr;
    },

    getFirstDestructiveGroup: function (): HTMLElement | null {
      return (
        this.$container.children('ul:has([data-destructive]):first').get(0) ||
        null
      );
    },

    addGroup: function (
      heading: string | null = null,
      addHrs: boolean = true,
      before: HTMLElement | null = null
    ): HTMLElement {
      const padded = this.isPadded();

      if (heading) {
        const h6 = document.createElement('h6');
        if (padded) {
          h6.className = 'padded';
        }
        h6.textContent = heading;

        if (before) {
          before.parentNode!.insertBefore(h6, before);
        } else {
          this.$container.append(h6);
        }
      }

      const ul = document.createElement('ul');
      if (padded) {
        ul.className = 'padded';
      }

      if (before) {
        before.parentNode!.insertBefore(ul, before);
      } else {
        this.$container.append(ul);
      }

      if (addHrs) {
        if (
          ul.previousElementSibling &&
          ul.previousElementSibling.nodeName !== 'HR'
        ) {
          this.addHr(ul);
        }
        if (ul.nextElementSibling && ul.nextElementSibling !== 'HR') {
          this.addHr(ul.nextElementSibling as HTMLElement);
        }
      }

      this.updateHrVisibility();

      return ul;
    },

    toggleItem: function (el: HTMLElement, show?: boolean): void {
      if (typeof show === 'undefined') {
        show = el.parentElement!.classList.contains('hidden');
      }

      if (show) {
        this.showItem(el);
      } else {
        this.hideItem(el);
      }
    },

    showItem: function (el: HTMLElement): void {
      const li = el.parentElement!;
      li.classList.remove('hidden');
      const ul = li.parentElement!;
      if (ul.classList.contains('hidden')) {
        ul.classList.remove('hidden');
      }

      this.updateHrVisibility();

      if (this.isExpanded()) {
        this.setContainerPosition();
      }
    },

    hideItem: function (el: HTMLElement): void {
      const li = el.parentElement!;
      li.classList.add('hidden');
      const ul = li.parentElement!;
      if (ul.querySelectorAll(':scope > li:not(.hidden)').length === 0) {
        ul.classList.add('hidden');
      }

      this.updateHrVisibility();

      if (this.isExpanded()) {
        this.setContainerPosition();
      }
    },

    removeItem: function (el: HTMLElement): void {
      const li = el.parentElement!;
      const ul = li.parentElement!;
      li.remove();
      if (ul.querySelectorAll(':scope > li').length === 0) {
        ul.remove();
      }
      if (ul.querySelectorAll(':scope > li:not(.hidden)').length === 0) {
        ul.classList.add('hidden');
      }

      this.updateHrVisibility();

      if (this.isExpanded()) {
        this.setContainerPosition();
      }
    },

    updateHrVisibility: function (): void {
      const $children = this.$container.children();
      let foundVisibleGroup = false;
      $children.each((i, child) => {
        if (child.nodeName === 'HR') {
          if (foundVisibleGroup) {
            child.classList.remove('hidden');
            foundVisibleGroup = false;
          } else {
            child.classList.add('hidden');
          }
        } else if (!child.classList.contains('hidden')) {
          foundVisibleGroup = true;
        }
      });
    },

    /**
     * Destroy
     */
    destroy: function (): void {
      this.$trigger!.removeData('trigger');

      Garnish.DisclosureMenu.instances =
        Garnish.DisclosureMenu.instances.filter((o: any) => o !== this);

      this.base();
    },

    _alignLeft: function (): void {
      this.$container.css({
        left: Math.max(this._alignmentElementOffset!.left, 0),
        right: 'auto',
      });
    },

    _alignRight: function (): void {
      const right =
        this._viewportWidth! -
        (this._alignmentElementOffset!.left + this._alignmentElementWidth!);

      this.$container.css({
        right: Math.max(right, 0),
        left: 'auto',
      });
    },

    _alignCenter: function (): void {
      const left = Math.round(
        this._alignmentElementOffset!.left +
          this._alignmentElementWidth! / 2 -
          this._menuWidth! / 2
      );

      this.$container.css({
        left: Math.max(left, 0),
        right: 'auto',
      });
    },
  } as DisclosureMenuInterface,
  {
    defaults: {
      position: null,
      windowSpacing: 5,
      withSearchInput: false,
    } as DisclosureMenuSettings,

    /**
     * @type {DisclosureMenuInterface[]}
     */
    instances: [] as DisclosureMenuInterface[],
  }
);
