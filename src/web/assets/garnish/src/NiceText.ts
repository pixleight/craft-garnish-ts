import Garnish from './Garnish';
import Base from './Base';
import {NiceTextInterface, NiceTextSettings, JQueryElement} from './types';
import $ from 'jquery';

/**
 * Nice Text
 */
export default Base.extend(
  {
    $input: null as JQueryElement | null,
    $hint: null as JQueryElement | null,
    $hintContainer: undefined as JQueryElement | undefined,
    $stage: null as JQueryElement | null,
    $charsLeft: null as JQueryElement | null,
    autoHeight: null as boolean | null,
    maxLength: null as number | null,
    showCharsLeft: false,
    showingHint: false,
    val: null as string | null,
    inputBoxSizing: 'content-box',
    width: null as number | null,
    height: null as number | null,
    minHeight: null as number | null,
    initialized: false,

    init: function (
      input: string | HTMLElement | JQueryElement,
      settings?: NiceTextSettings
    ): void {
      this.$input = $(input);
      this.settings = $.extend({}, Garnish.NiceText.defaults, settings);

      if (this.isVisible()) {
        this.initialize();
      } else {
        this.addListener(Garnish.$win, 'resize', 'initializeIfVisible');
      }
    },

    isVisible: function (): boolean {
      return this.$input!.height()! > 0;
    },

    initialize: function (): void {
      if (this.initialized) {
        return;
      }

      this.initialized = true;
      this.removeListener(Garnish.$win, 'resize');

      const maxLengthAttr = this.$input!.attr('maxlength');
      this.maxLength = maxLengthAttr ? parseInt(maxLengthAttr) : null;

      if (
        this.maxLength &&
        (this.settings.showCharsLeft ||
          Garnish.hasAttr(this.$input!, 'data-show-chars-left'))
      ) {
        this.showCharsLeft = true;

        // Remove the maxlength attribute
        this.$input!.removeAttr('maxlength');
      }

      // Is this already a transparent text input?
      if (this.$input!.data('nicetext')) {
        console.warn(
          'Double-instantiating a transparent text input on an element'
        );
        this.$input!.data('nicetext').destroy();
      }

      this.$input!.data('nicetext', this);

      this.getVal();

      this.autoHeight =
        this.settings.autoHeight &&
        this.$input!.prop('nodeName') === 'TEXTAREA';

      if (this.autoHeight) {
        this.minHeight = this.getHeightForValue('');
        this.updateHeight();

        // Update height when the window resizes
        this.width = this.$input!.width()!;
        this.addListener(Garnish.$win, 'resize', 'updateHeightIfWidthChanged');
      }

      if (this.settings.hint) {
        this.$hintContainer = $(
          '<div class="texthint-container"/>'
        ).insertBefore(this.$input!);
        this.$hint = $(
          '<div class="texthint">' + this.settings.hint + '</div>'
        ).appendTo(this.$hintContainer);
        this.$hint.css({
          top:
            parseInt(this.$input!.css('borderTopWidth')) +
            parseInt(this.$input!.css('paddingTop')),
          left:
            parseInt(this.$input!.css('borderLeftWidth')) +
            parseInt(this.$input!.css('paddingLeft')) +
            1,
        });
        Garnish.copyTextStyles(this.$input!, this.$hint);

        if (this.val) {
          this.$hint.hide();
        } else {
          this.showingHint = true;
        }

        // Focus the input when clicking on the hint
        this.addListener(
          this.$hint,
          'mousedown',
          (ev: JQuery.MouseDownEvent) => {
            ev.preventDefault();
            this.$input!.focus();
          }
        );
      }

      if (this.showCharsLeft) {
        this.$charsLeft = $(
          '<div aria-live="polite" class="' +
            this.settings.charsLeftClass +
            '"/>'
        ).insertAfter(this.$input!);
        this.updateCharsLeft();
      }

      this.addListener(this.$input!, 'textchange', 'onTextChange');
      this.addListener(this.$input!, 'keydown', 'onKeyDown');
    },

    initializeIfVisible: function (): void {
      if (this.isVisible()) {
        this.initialize();
      }
    },

    getVal: function (): string {
      this.val = this.$input!.val() as string;
      return this.val;
    },

    showHint: function (): void {
      this.$hint!.velocity('fadeIn', {
        complete: Garnish.NiceText.hintFadeDuration,
      });

      this.showingHint = true;
    },

    hideHint: function (): void {
      this.$hint!.velocity('fadeOut', {
        complete: Garnish.NiceText.hintFadeDuration,
      });

      this.showingHint = false;
    },

    onTextChange: function (): void {
      this.getVal();

      if (this.$hint) {
        if (this.showingHint && this.val) {
          this.hideHint();
        } else if (!this.showingHint && !this.val) {
          this.showHint();
        }
      }

      if (this.autoHeight) {
        this.updateHeight();
      }

      if (this.showCharsLeft) {
        this.updateCharsLeft();
      }
    },

    onKeyDown: function (ev: JQuery.KeyDownEvent): void {
      // If Ctrl/Command + Return is pressed, submit the closest form
      if (ev.keyCode === Garnish.RETURN_KEY && Garnish.isCtrlKeyPressed(ev)) {
        ev.preventDefault();
        this.$input!.closest('form').submit();
      }
    },

    buildStage: function (): void {
      this.$stage = $('<stage/>').appendTo(Garnish.$bod);

      // replicate the textarea's text styles
      this.$stage.css({
        display: 'block',
        position: 'absolute',
        top: -9999,
        left: -9999,
      });

      this.inputBoxSizing = this.$input!.css('box-sizing');

      if (this.inputBoxSizing === 'border-box') {
        this.$stage.css({
          'border-top': this.$input!.css('border-top'),
          'border-right': this.$input!.css('border-right'),
          'border-bottom': this.$input!.css('border-bottom'),
          'border-left': this.$input!.css('border-left'),
          'padding-top': this.$input!.css('padding-top'),
          'padding-right': this.$input!.css('padding-right'),
          'padding-bottom': this.$input!.css('padding-bottom'),
          'padding-left': this.$input!.css('padding-left'),
          '-webkit-box-sizing': this.inputBoxSizing,
          '-moz-box-sizing': this.inputBoxSizing,
          'box-sizing': this.inputBoxSizing,
        });
      }

      Garnish.copyTextStyles(this.$input!, this.$stage);
    },

    getHeightForValue: function (val: string): number {
      if (!this.$stage) {
        this.buildStage();
      }

      if (this.inputBoxSizing === 'border-box') {
        this.$stage!.css('width', this.$input!.outerWidth());
      } else {
        this.$stage!.css('width', this.$input!.width());
      }

      if (!val) {
        val = '&nbsp;';
        for (var i = 1; i < this.$input!.prop('rows'); i++) {
          val += '<br/>&nbsp;';
        }
      } else {
        // Ampersand entities
        val = val.replace(/&/g, '&amp;');

        // < and >
        val = val.replace(/</g, '&lt;');
        val = val.replace(/>/g, '&gt;');

        // Multiple spaces
        val = val.replace(/ {2,}/g, function (spaces: string): string {
          // TODO: replace with String.repeat() when more broadly available?
          var replace = '';
          for (var i = 0; i < spaces.length - 1; i++) {
            replace += '&nbsp;';
          }
          return replace + ' ';
        });

        // Line breaks
        val = val.replace(/[\n\r]$/g, '<br/>&nbsp;');
        val = val.replace(/[\n\r]/g, '<br/>');
      }

      this.$stage!.html(val);

      let height: number;
      if (this.inputBoxSizing === 'border-box') {
        height = this.$stage!.outerHeight()!;
      } else {
        height = this.$stage!.height()!;
      }

      if (this.minHeight && height < this.minHeight) {
        height = this.minHeight;
      }

      return height;
    },

    updateHeight: function (): void {
      // has the height changed?
      const newHeight = this.getHeightForValue(this.val!);
      if (this.height !== newHeight) {
        this.height = newHeight;
        this.$input!.css('min-height', this.height);

        if (this.initialized) {
          this.onHeightChange();
        }
      }
    },

    updateHeightIfWidthChanged: function (): void {
      const newWidth = this.$input!.width()!;
      if (this.isVisible() && this.width !== newWidth && newWidth) {
        this.width = newWidth;
        this.updateHeight();
      }
    },

    onHeightChange: function (): void {
      this.settings.onHeightChange!();
    },

    updateCharsLeft: function (): void {
      const charsLeft = this.maxLength! - this.val!.length;
      this.$charsLeft!.html(Garnish.NiceText.charsLeftHtml(charsLeft));

      if (charsLeft >= 0) {
        this.$charsLeft!.removeClass(this.settings.negativeCharsLeftClass!);
      } else {
        this.$charsLeft!.addClass(this.settings.negativeCharsLeftClass!);
      }
    },

    /**
     * Destroy
     */
    destroy: function (): void {
      this.$input!.removeData('nicetext');

      if (this.$hint) {
        this.$hint.remove();
      }

      if (this.$stage) {
        this.$stage.remove();
      }

      this.base();
    },
  } as NiceTextInterface,
  {
    interval: 100,
    hintFadeDuration: 50,
    charsLeftHtml: function (charsLeft: number): string {
      return charsLeft.toString();
    },
    defaults: {
      autoHeight: true,
      showCharsLeft: false,
      charsLeftClass: 'chars-left',
      negativeCharsLeftClass: 'negative-chars-left',
      onHeightChange: $.noop,
    } as NiceTextSettings,
  }
);
