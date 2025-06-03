import Garnish from './Garnish';
import Base from './Base';
import $ from 'jquery';

interface CheckboxSelectInterface {
  $container: JQuery | null;
  $all: JQuery | null;
  $options: JQuery | null;

  init(container: HTMLElement | JQuery): void;
  onAllChange(): void;
  destroy(): void;
}

/**
 * Checkbox select class
 */
export default Base.extend({
  $container: null,
  $all: null,
  $options: null,

  init: function (
    this: CheckboxSelectInterface,
    container: HTMLElement | JQuery
  ): void {
    this.$container = $(container);

    // Is this already a checkbox select?
    if (this.$container.data('checkboxSelect')) {
      console.warn('Double-instantiating a checkbox select on an element');
      this.$container.data('checkboxSelect').destroy();
    }

    this.$container.data('checkboxSelect', this);

    const $checkboxes = this.$container.find('input');
    this.$all = $checkboxes.filter('.all:first');
    this.$options = $checkboxes.not(this.$all);

    this.addListener(this.$all, 'change', 'onAllChange');
  },

  onAllChange: function (this: CheckboxSelectInterface): void {
    const isAllChecked = this.$all!.prop('checked');

    this.$options!.prop({
      checked: isAllChecked,
      disabled: isAllChecked,
    });
  },

  /**
   * Destroy
   */
  destroy: function (this: CheckboxSelectInterface): void {
    this.$container!.removeData('checkboxSelect');
    this.base();
  },
});
