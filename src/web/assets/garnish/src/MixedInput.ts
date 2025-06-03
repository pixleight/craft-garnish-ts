import Garnish from './Garnish';
import Base from './Base';
import {
  MixedInputInterface,
  MixedInputSettings,
  TextElementInterface,
  JQueryElement,
} from './types';
import $ from 'jquery';

/**
 * Mixed input
 *
 * @todo RTL support, in the event that the input doesn't have dir="ltr".
 */
export default Base.extend({
  $container: null as JQueryElement | null,
  elements: null as JQueryElement[] | null,
  focussedElement: null as JQueryElement | null,
  blurTimeout: null as number | null,

  init: function (
    container: string | HTMLElement | JQueryElement,
    settings?: MixedInputSettings
  ): void {
    this.$container = $(container);
    this.setSettings(settings, Garnish.MixedInput.defaults);

    this.elements = [];

    // Allow the container to receive focus
    this.$container.attr('tabindex', '0');
    this.addListener(this.$container, 'focus', 'onFocus');
  },

  getElementIndex: function ($elem: JQueryElement): number {
    return $.inArray($elem, this.elements!);
  },

  isText: function ($elem: JQueryElement): boolean {
    return $elem.prop('nodeName') === 'INPUT';
  },

  onFocus: function (): void {
    // Set focus to the last element
    if (this.elements!.length) {
      var $elem = this.elements![this.elements!.length - 1];
      this.setFocus($elem);
      if (this.isText($elem)) {
        this.setCaretPos($elem, ($elem.val() as string).length);
      }
    } else {
      this.addTextElement();
    }
  },

  addTextElement: function (
    index?: number,
    focus: boolean = true
  ): TextElementInterface {
    var text = new TextElement(this);
    this.addElement(text.$input, index, focus);
    text.setWidth();
    return text;
  },

  addElement: function (
    $elem: JQueryElement,
    index?: number,
    focus: boolean = true
  ): void {
    // Was a target index passed, and is it valid?
    if (typeof index === 'undefined') {
      if (this.focussedElement) {
        var focussedElement = this.focussedElement,
          focussedElementIndex = this.getElementIndex(focussedElement);

        // Is the focus on a text element?
        if (this.isText(focussedElement)) {
          var selectionStart = focussedElement.prop('selectionStart') as number,
            selectionEnd = focussedElement.prop('selectionEnd') as number,
            val = focussedElement.val() as string,
            preVal = val.substring(0, selectionStart),
            postVal = val.substring(selectionEnd);

          if (preVal && postVal) {
            // Split the input into two
            focussedElement.val(preVal).trigger('change');
            var newText = new TextElement(this);
            newText.$input.val(postVal).trigger('change');
            this.addElement(newText.$input, focussedElementIndex + 1);

            // Insert the new element in between them
            index = focussedElementIndex + 1;
          } else if (!preVal) {
            // Insert the new element before this one
            index = focussedElementIndex;
          } else {
            // Insert it after this one
            index = focussedElementIndex + 1;
          }
        } else {
          // Just insert the new one after this one
          index = focussedElementIndex + 1;
        }
      } else {
        // Insert the new element at the end
        index = this.elements!.length;
      }
    }

    // Add the element
    if (typeof this.elements![index] !== 'undefined') {
      $elem.insertBefore(this.elements![index]);
      this.elements!.splice(index, 0, $elem);
    } else {
      // Just for safe measure, set the index to what it really will be
      index = this.elements!.length;

      this.$container!.append($elem);
      this.elements!.push($elem);
    }

    // Make sure that there are text elements surrounding all non-text elements
    if (!this.isText($elem)) {
      // Add a text element before?
      if (index === 0 || !this.isText(this.elements![index - 1])) {
        this.addTextElement(index);
        index++;
      }

      // Add a text element after?
      if (
        index === this.elements!.length - 1 ||
        !this.isText(this.elements![index + 1])
      ) {
        this.addTextElement(index + 1);
      }
    }

    // Add event listeners
    this.addListener($elem, 'click', () => {
      this.setFocus($elem);
    });

    if (focus) {
      // Set focus to the new element
      setTimeout(() => {
        this.setFocus($elem);
      }, 1);
    }
  },

  removeElement: function ($elem: JQueryElement): void {
    var index = this.getElementIndex($elem);
    if (index !== -1) {
      this.elements!.splice(index, 1);

      if (!this.isText($elem)) {
        // Combine the two now-adjacent text elements
        var $prevElem = this.elements![index - 1],
          $nextElem = this.elements![index];

        if (this.isText($prevElem) && this.isText($nextElem)) {
          var prevElemVal = $prevElem.val() as string,
            newVal = prevElemVal + ($nextElem.val() as string);
          $prevElem.val(newVal).trigger('change');
          this.removeElement($nextElem);
          this.setFocus($prevElem);
          this.setCaretPos($prevElem, prevElemVal.length);
        }
      }

      $elem.remove();
    }
  },

  setFocus: function ($elem: JQueryElement): void {
    this.$container!.addClass('focus');

    if (!this.focussedElement) {
      // Prevent the container from receiving focus
      // as long as one of its elements has focus
      this.$container!.attr('tabindex', '-1');
    } else {
      // Blur the previously-focussed element
      this.blurFocussedElement();
    }

    $elem.attr('tabindex', '0');
    $elem.focus();
    this.focussedElement = $elem;

    this.addListener($elem, 'blur', () => {
      this.blurTimeout = setTimeout(() => {
        if (this.focussedElement === $elem) {
          this.blurFocussedElement();
          this.focussedElement = null;
          this.$container!.removeClass('focus');

          // Get ready for future focus
          this.$container!.attr('tabindex', '0');
        }
      }, 1);
    });
  },

  blurFocussedElement: function (): void {
    this.removeListener(this.focussedElement!, 'blur');
    this.focussedElement!.attr('tabindex', '-1');
  },

  focusPreviousElement: function ($from: JQueryElement): void {
    var index = this.getElementIndex($from);

    if (index > 0) {
      var $elem = this.elements![index - 1];
      this.setFocus($elem);

      // If it's a text element, put the caret at the end
      if (this.isText($elem)) {
        var length = ($elem.val() as string).length;
        this.setCaretPos($elem, length);
      }
    }
  },

  focusNextElement: function ($from: JQueryElement): void {
    var index = this.getElementIndex($from);

    if (index < this.elements!.length - 1) {
      var $elem = this.elements![index + 1];
      this.setFocus($elem);

      // If it's a text element, put the caret at the beginning
      if (this.isText($elem)) {
        this.setCaretPos($elem, 0);
      }
    }
  },

  focusStart: function (): void {
    const $elem = this.elements![0];
    this.setFocus($elem);

    // If it's a text element, put the caret at the beginning
    if (this.isText($elem)) {
      this.setCaretPos($elem, 0);
    }
  },

  focusEnd: function (): void {
    const $elem = this.elements![this.elements!.length - 1];
    this.setFocus($elem);

    // If it's a text element, put the caret at the end
    if (this.isText($elem)) {
      this.setCaretPos($elem, ($elem.val() as string).length);
    }
  },

  /** @deprecated */
  setCarotPos: function ($elem: JQueryElement, pos: number): void {
    this.setCaretPos($elem, pos);
  },

  setCaretPos: function ($elem: JQueryElement, pos: number): void {
    $elem.prop('selectionStart', pos);
    $elem.prop('selectionEnd', pos);
  },
} as MixedInputInterface);

var TextElement = Base.extend(
  {
    parentInput: null as MixedInputInterface | null,
    $input: null as JQueryElement | null,
    $stage: null as JQueryElement | null,
    val: null as string | null,
    focussed: false,
    interval: null as number | null,
    stageWidth: undefined as number | undefined,

    init: function (parentInput: MixedInputInterface): void {
      this.parentInput = parentInput;

      this.$input = $('<input type="text"/>').appendTo(
        this.parentInput.$container!
      );
      this.$input.css('margin-right', 2 - TextElement.padding + 'px');

      this.setWidth(true);

      this.addListener(this.$input, 'focus', 'onFocus');
      this.addListener(this.$input, 'blur', 'onBlur');
      this.addListener(this.$input, 'keydown', 'onKeyDown');
      this.addListener(this.$input, 'change', 'checkInput');
    },

    getIndex: function (): number {
      return this.parentInput!.getElementIndex(this.$input!);
    },

    buildStage: function (): void {
      this.$stage = $('<stage/>').appendTo(Garnish.$bod);

      // replicate the textarea's text styles
      this.$stage.css({
        position: 'absolute',
        top: -9999,
        left: -9999,
        wordWrap: 'nowrap',
      });

      Garnish.copyTextStyles(this.$input!, this.$stage);
    },

    getTextWidth: function (val?: string): number {
      if (!this.$stage) {
        this.buildStage();
      }

      if (val) {
        // Ampersand entities
        val = val.replace(/&/g, '&amp;');

        // < and >
        val = val.replace(/</g, '&lt;');
        val = val.replace(/>/g, '&gt;');

        // Spaces
        val = val.replace(/ /g, '&nbsp;');
      }

      this.$stage!.html(val || '');
      this.stageWidth = this.$stage!.width()!;
      return this.stageWidth;
    },

    onFocus: function (): void {
      this.focussed = true;
      this.interval = setInterval(
        this.checkInput.bind(this),
        Garnish.NiceText.interval
      );
      this.checkInput();
    },

    onBlur: function (): void {
      this.focussed = false;
      if (this.interval) {
        clearInterval(this.interval);
      }
      this.checkInput();
    },

    onKeyDown: function (ev: JQuery.KeyDownEvent): void {
      setTimeout(this.checkInput.bind(this), 1);

      switch (ev.keyCode) {
        case Garnish.LEFT_KEY: {
          if (Garnish.isCtrlKeyPressed(ev)) {
            ev.preventDefault();
            this.parentInput!.focusStart();
          } else if (
            this.$input!.prop('selectionStart') === 0 &&
            this.$input!.prop('selectionEnd') === 0
          ) {
            // Set focus to the previous element
            this.parentInput!.focusPreviousElement(this.$input!);
          }
          break;
        }

        case Garnish.RIGHT_KEY: {
          if (Garnish.isCtrlKeyPressed(ev)) {
            ev.preventDefault();
            this.parentInput!.focusEnd();
          } else if (
            this.$input!.prop('selectionStart') === this.val!.length &&
            this.$input!.prop('selectionEnd') === this.val!.length
          ) {
            // Set focus to the next element
            this.parentInput!.focusNextElement(this.$input!);
          }
          break;
        }

        case Garnish.BACKSPACE_KEY:
        case Garnish.DELETE_KEY: {
          if (
            this.$input!.prop('selectionStart') === 0 &&
            this.$input!.prop('selectionEnd') === 0
          ) {
            // Set focus to the previous element
            this.parentInput!.focusPreviousElement(this.$input!);
            ev.preventDefault();
          }
        }
      }
    },

    getVal: function (): string {
      this.val = this.$input!.val() as string;
      return this.val;
    },

    setVal: function (val: string): void {
      this.$input!.val(val);
      this.checkInput();
    },

    checkInput: function (): boolean {
      // Has the value changed?
      var changed = this.val !== this.getVal();
      if (changed) {
        this.setWidth();
        this.onChange();
      }

      return changed;
    },

    setWidth: function (force: boolean = false): void {
      // has the width changed?
      if (this.stageWidth !== this.getTextWidth(this.val!) || force) {
        // update the textarea width
        var width = this.stageWidth! + TextElement.padding;
        this.$input!.width(width);
      }
    },

    onChange: $.noop,
  } as TextElementInterface,
  {
    padding: 20,
  }
);
