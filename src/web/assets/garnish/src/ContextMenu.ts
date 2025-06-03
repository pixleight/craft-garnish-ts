import Garnish from './Garnish';
import Base from './Base';
import $ from 'jquery';
import {
  ContextMenuOptions,
  ContextMenuSettings,
  ContextMenuInterface,
  ElementOrJQuery,
  JQueryElement,
  ContextMenuOption,
} from './types';

/**
 * Context Menu
 */
const ContextMenu = Base.extend<ContextMenuInterface>(
  {
    $target: null as any,
    options: null as any,
    $menu: null,
    showingMenu: false,
    showing: false,
    currentTarget: undefined,

    /**
     * Constructor
     */
    init: function (
      this: ContextMenuInterface,
      target: ElementOrJQuery,
      options: ContextMenuOptions,
      settings?: ContextMenuSettings
    ): void {
      this.$target = $(target);

      // Is this already a context menu target?
      if (this.$target.data('contextmenu')) {
        console.warn('Double-instantiating a context menu on an element');
        (this.$target.data('contextmenu') as ContextMenuInterface).destroy();
      }

      this.$target.data('contextmenu', this);

      this.options = options;
      (this as any).setSettings(settings, (ContextMenu as any).defaults);

      (ContextMenu as any).counter++;

      this.enable();
    },

    /**
     * Build Menu
     */
    buildMenu: function (this: ContextMenuInterface): void {
      this.$menu = $(
        '<div class="' + this.settings.menuClass + '" style="display: none" />'
      );

      let $ul = $('<ul/>').appendTo(this.$menu);

      for (const i in this.options) {
        if (!this.options.hasOwnProperty(i)) {
          continue;
        }

        const option = this.options[i];

        if (option === '-') {
          // Create a new <ul>
          $('<hr/>').appendTo(this.$menu);
          $ul = $('<ul/>').appendTo(this.$menu);
        } else {
          const optionItem = option as ContextMenuOption;
          const $li = $('<li></li>').appendTo($ul);
          const $a = $('<a>' + optionItem.label + '</a>').appendTo($li);

          if (typeof optionItem.onClick === 'function') {
            // maintain the current $a and options.onClick variables
            ((
              currentA: JQueryElement,
              onClick: (event: JQuery.TriggeredEvent) => void
            ) => {
              setTimeout(() => {
                currentA.mousedown((ev: JQuery.TriggeredEvent) => {
                  this.hideMenu();
                  // call the onClick callback, with the scope set to the item,
                  // and pass it the event with currentTarget set to the item as well
                  onClick.call(
                    this.currentTarget,
                    $.extend(ev, {currentTarget: this.currentTarget})
                  );
                });
              }, 1);
            })($a, optionItem.onClick);
          }
        }
      }
    },

    /**
     * Show Menu
     */
    showMenu: function (
      this: ContextMenuInterface,
      ev: JQuery.TriggeredEvent
    ): void {
      // Ignore left mouse clicks
      if (
        ev.type === 'mousedown' &&
        (ev as any).which !== Garnish.SECONDARY_CLICK
      ) {
        return;
      }

      if (ev.type === 'contextmenu') {
        // Prevent the real context menu from showing
        ev.preventDefault();
      }

      // Ignore if already showing
      if (this.showing && ev.currentTarget === this.currentTarget) {
        return;
      }

      this.currentTarget = ev.currentTarget as HTMLElement;

      if (!this.$menu) {
        this.buildMenu();
      }

      this.$menu!.appendTo(document.body);
      this.$menu!.show();
      this.$menu!.css({left: ev.pageX! + 1, top: ev.pageY! - 4});

      this.showing = true;
      (this as any).trigger('show');
      Garnish.uiLayerManager.addLayer(this.$menu!);
      Garnish.uiLayerManager.registerShortcut(
        Garnish.ESC_KEY,
        this.hideMenu.bind(this)
      );

      setTimeout(() => {
        (this as any).addListener(Garnish.$doc, 'mousedown', 'hideMenu');
      }, 0);
    },

    /**
     * Hide Menu
     */
    hideMenu: function (this: ContextMenuInterface): void {
      (this as any).removeListener(Garnish.$doc, 'mousedown');
      this.$menu!.hide();
      this.showing = false;
      (this as any).trigger('hide');
      Garnish.uiLayerManager.removeLayer();
    },

    /**
     * Enable
     */
    enable: function (this: ContextMenuInterface): void {
      (this as any).addListener(
        this.$target,
        'contextmenu,mousedown',
        'showMenu'
      );
    },

    /**
     * Disable
     */
    disable: function (this: ContextMenuInterface): void {
      (this as any).removeListener(this.$target, 'contextmenu,mousedown');
    },

    /**
     * Destroy
     */
    destroy: function (this: ContextMenuInterface): void {
      this.$target.removeData('contextmenu');
      (this as any).base();
    },
  },
  {
    defaults: {
      menuClass: 'menu',
    } as ContextMenuSettings,
    counter: 0,
  }
);

export default ContextMenu;
