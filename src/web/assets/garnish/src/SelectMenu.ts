import Garnish from './Garnish';
import CustomSelect from './CustomSelect';
import $ from 'jquery';
import {
  ElementOrJQuery,
  JQueryElement,
  SelectMenuInterface,
  SelectMenuSettings,
} from './types';

/**
 * Select Menu
 */
export default CustomSelect.extend<SelectMenuInterface>(
  {
    selected: -1,

    /**
     * Constructor
     */
    init: function (
      btn: ElementOrJQuery,
      options: any[],
      settings?: SelectMenuSettings | (() => void),
      callback?: () => void
    ): void {
      // argument mapping
      if (typeof settings === 'function') {
        // (btn, options, callback)
        callback = settings;
        settings = {};
      }

      const mergedSettings = $.extend(
        {},
        Garnish.SelectMenu.defaults,
        settings
      );

      this.base(btn, options, mergedSettings, callback);

      this.selected = -1;
    },

    /**
     * Build
     */
    build: function (): void {
      this.base();

      if (this.selected !== -1) {
        this._addSelectedOptionClass(this.selected);
      }
    },

    /**
     * Select
     */
    select: function (option: number): void {
      // ignore if it's already selected
      if (option === this.selected) {
        return;
      }

      if (this.dom.ul) {
        if (this.selected !== -1) {
          this.dom.options![this.selected].className = '';
        }

        this._addSelectedOptionClass(option);
      }

      this.selected = option;

      // set the button text to the selected option
      this.setBtnText($((this as any).options[option].label).text());

      this.base(option);
    },

    /**
     * Add Selected Option Class
     */
    _addSelectedOptionClass: function (option: number): void {
      this.dom.options![option].className = 'sel';
    },

    /**
     * Set Button Text
     */
    setBtnText: function (text: string): void {
      this.dom.$btnLabel.text(text);
    },
  },
  {
    defaults: {
      ulClass: 'menu select',
    } as SelectMenuSettings,
  }
);
