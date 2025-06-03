import $ from 'jquery';
import Base from './Base';
import BaseDrag from './BaseDrag';
import CheckboxSelect from './CheckboxSelect';
import ContextMenu from './ContextMenu';
import CustomSelect from './CustomSelect';
import DisclosureMenu from './DisclosureMenu';
import Drag from './Drag';
import DragDrop from './DragDrop';
import DragMove from './DragMove';
import DragSort from './DragSort';
import EscManager from './EscManager';
import HUD from './HUD';
import MenuBtn from './MenuBtn';
import MixedInput from './MixedInput';
import Modal from './Modal';
import MultiFunctionBtn from './MultiFunctionBtn';
import NiceText from './NiceText';
import Select from './Select';
import SelectMenu from './SelectMenu';
import UiLayerManager from './UiLayerManager';
import type {
  GarnishEventHandler,
  PostData,
  Offset,
  ElementOrJQuery,
  JQueryElement,
} from './types';

/**
 * @namespace Garnish
 */

// Bail if Garnish is already defined
if (typeof (window as any).Garnish !== 'undefined') {
  throw 'Garnish is already defined!';
}

interface GarnishStatic {
  // jQuery objects for common elements
  $win: JQuery;
  $doc: JQuery;
  $bod: JQuery;
  $scrollContainer: JQuery;

  // Boolean flags
  rtl: boolean;
  ltr: boolean;
  activateEventsMuted: boolean;
  resizeEventsMuted: boolean;

  // Constants - Key codes
  BACKSPACE_KEY: number;
  TAB_KEY: number;
  CLEAR_KEY: number;
  RETURN_KEY: number;
  SHIFT_KEY: number;
  CTRL_KEY: number;
  ALT_KEY: number;
  ESC_KEY: number;
  SPACE_KEY: number;
  PAGE_UP_KEY: number;
  PAGE_DOWN_KEY: number;
  END_KEY: number;
  HOME_KEY: number;
  LEFT_KEY: number;
  UP_KEY: number;
  RIGHT_KEY: number;
  DOWN_KEY: number;
  DELETE_KEY: number;
  A_KEY: number;
  S_KEY: number;
  CMD_KEY: number;
  META_KEY: number;

  // ARIA classes
  JS_ARIA_CLASS: string;
  JS_ARIA_TRUE_CLASS: string;
  JS_ARIA_FALSE_CLASS: string;

  // Mouse button constants
  PRIMARY_CLICK: number;
  SECONDARY_CLICK: number;

  // Axis constants
  X_AXIS: string;
  Y_AXIS: string;

  // Other constants
  FX_DURATION: number;
  TEXT_NODE: number;
  SHAKE_STEPS: number;
  SHAKE_STEP_DURATION: number;

  // Private properties
  _isMobileBrowser: boolean | null;
  _isMobileOrTabletBrowser: boolean | null;
  _eventHandlers: GarnishEventHandler[];

  // Layer manager
  uiLayerManager: any;

  // Private methods
  _normalizeEvents(events: string | string[]): string[][];

  // Methods
  log(msg: string): void;
  isMobileBrowser(detectTablets?: boolean): boolean;
  prefersReducedMotion(): boolean;
  getUserPreferredAnimationDuration(duration: string | number): string | number;
  isArray(val: any): val is any[];
  isJquery(val: any): val is JQuery;
  isString(val: any): val is string;
  hasAttr(elem: ElementOrJQuery, attr: string): boolean;
  isTextNode(elem: any): boolean;
  getOffset(elem: ElementOrJQuery): Offset;
  getDist(x1: number, y1: number, x2: number, y2: number): number;
  hitTest(x: number, y: number, elem: ElementOrJQuery): boolean;
  isCursorOver(ev: MouseEvent, elem: ElementOrJQuery): boolean;
  copyTextStyles(source: ElementOrJQuery, target: ElementOrJQuery): void;
  addModalAttributes(container: ElementOrJQuery): void;
  hideModalBackgroundLayers(): void;
  resetModalBackgroundLayerVisibility(): void;
  ariaHide(element: ElementOrJQuery): void;
  isScriptOrStyleElement(element: ElementOrJQuery): boolean;
  hasJsAriaClass(element: ElementOrJQuery): boolean;
  focusIsInside(container: ElementOrJQuery): boolean;
  firstFocusableElement(container: ElementOrJQuery): JQuery;
  getKeyboardFocusableElements(container: ElementOrJQuery): JQuery;
  isKeyboardFocusable(element: ElementOrJQuery): boolean;
  trapFocusWithin(container: ElementOrJQuery): void;
  releaseFocusWithin(container: ElementOrJQuery): void;
  setFocusWithin(container: ElementOrJQuery): void;
  getFocusedElement(): JQuery;
  handleActivatingKeypress(event: KeyboardEvent, callback: () => void): void;
  getBodyScrollTop(): number;
  requestAnimationFrame(fn: () => void): number;
  cancelAnimationFrame(id: number): void;
  scrollContainerToElement(
    container: ElementOrJQuery,
    elem?: ElementOrJQuery
  ): void;
  shake(elem: ElementOrJQuery, prop?: string): void;
  getElement(elem: ElementOrJQuery | ElementOrJQuery[]): HTMLElement;
  getInputBasename(elem: ElementOrJQuery): string | null;
  getInputPostVal($input: JQuery): string | string[] | null;
  findInputs(container: ElementOrJQuery): JQuery;
  getPostData(container: ElementOrJQuery): PostData;
  copyInputValues(source: ElementOrJQuery, target: ElementOrJQuery): void;
  isPrimaryClick(ev: MouseEvent): boolean;
  isCtrlKeyPressed(ev: KeyboardEvent): boolean;
  on(
    target: any,
    events: string | string[],
    data: any,
    handler?: (event: any) => void
  ): void;
  on(
    target: any,
    events: string | string[],
    handler: (event: any) => void
  ): void;
  off(
    target: any,
    events: string | string[],
    handler: (event: any) => void
  ): void;
  once(
    target: any,
    events: string | string[],
    data: any,
    handler?: (event: any) => void
  ): void;
  once(
    target: any,
    events: string | string[],
    handler: (event: any) => void
  ): void;
  muteResizeEvents(callback: () => void): void;
  within(num: number, min: number, max: number): number;

  // Component classes
  Base: typeof Base;
  BaseDrag: any;
  CheckboxSelect: any;
  ContextMenu: any;
  CustomSelect: any;
  DisclosureMenu: any;
  Drag: any;
  DragDrop: any;
  DragMove: any;
  DragSort: any;
  EscManager: any;
  HUD: any;
  MenuBtn: any;
  MixedInput: any;
  Modal: any;
  MultiFunctionBtn: any;
  NiceText: any;
  Select: any;
  SelectMenu: any;
  UiLayerManager: any;
  Menu: any; // deprecated alias
  ShortcutManager: any; // deprecated alias
}

let Garnish: GarnishStatic = {
  // jQuery objects for common elements
  $win: $(window),
  $doc: $(document),
  $bod: $(document.body),
} as GarnishStatic;

Garnish.rtl = Garnish.$bod.hasClass('rtl');
Garnish.ltr = !Garnish.rtl;

Garnish = $.extend(Garnish, {
  $scrollContainer: Garnish.$win,
  activateEventsMuted: false,
  resizeEventsMuted: false,

  // Key code constants
  BACKSPACE_KEY: 8,
  TAB_KEY: 9,
  CLEAR_KEY: 12,
  RETURN_KEY: 13,
  SHIFT_KEY: 16,
  CTRL_KEY: 17,
  ALT_KEY: 18,
  ESC_KEY: 27,
  SPACE_KEY: 32,
  PAGE_UP_KEY: 33,
  PAGE_DOWN_KEY: 34,
  END_KEY: 35,
  HOME_KEY: 36,
  LEFT_KEY: 37,
  UP_KEY: 38,
  RIGHT_KEY: 39,
  DOWN_KEY: 40,
  DELETE_KEY: 46,
  A_KEY: 65,
  S_KEY: 83,
  CMD_KEY: 91,
  META_KEY: 224,

  // ARIA hidden classes
  JS_ARIA_CLASS: 'garnish-js-aria',
  JS_ARIA_TRUE_CLASS: 'garnish-js-aria-true',
  JS_ARIA_FALSE_CLASS: 'garnish-js-aria-false',

  // Mouse button constants
  PRIMARY_CLICK: 1,
  SECONDARY_CLICK: 3,

  // Axis constants
  X_AXIS: 'x',
  Y_AXIS: 'y',

  FX_DURATION: 200,

  // Node types
  TEXT_NODE: 3,

  /**
   * Logs a message to the browser's console, if the browser has one.
   *
   * @param {string} msg
   * @deprecated
   */
  log: function (msg: string): void {
    if (typeof console !== 'undefined' && typeof console.log === 'function') {
      console.log(msg);
    }
  },

  _isMobileBrowser: null,
  _isMobileOrTabletBrowser: null,

  /**
   * Returns whether this is a mobile browser.
   * Detection script courtesy of http://detectmobilebrowsers.com
   *
   * Last updated: 2014-11-24
   *
   * @param {boolean} detectTablets
   * @return {boolean}
   */
  isMobileBrowser: function (detectTablets?: boolean): boolean {
    const key = detectTablets ? '_isMobileOrTabletBrowser' : '_isMobileBrowser';

    if (Garnish[key] === null) {
      const a =
        navigator.userAgent || navigator.vendor || (window as any).opera;
      Garnish[key] =
        new RegExp(
          '(android|bbd+|meego).+mobile|avantgo|bada/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)/|plucker|pocket|psp|series(4|6)0|symbian|treo|up.(browser|link)|vodafone|wap|windows ce|xda|xiino' +
            (detectTablets ? '|android|ipad|playbook|silk' : ''),
          'i'
        ).test(a) ||
        /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
          a.substring(0, 4)
        );
    }

    return Garnish[key]!;
  },

  /**
   * Returns whether user prefers reduced motion
   *
   * @return {boolean}
   */
  prefersReducedMotion: function (): boolean {
    // Grab the prefers reduced media query.
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Check if the media query matches or is not available.
    return !mediaQuery || mediaQuery.matches;
  },

  /**
   * Returns either '0' or a set duration, based on a user's prefers-reduced-motion setting
   * Used to set the duration inside the Velocity.js options object in a way that respects user preferences
   * @param {string|integer} duration Either a ms duration or a named jQuery duration (i.e. 'fast', 'slow')
   * @return {string|integer}
   */
  getUserPreferredAnimationDuration: function (
    duration: string | number
  ): string | number {
    return Garnish.prefersReducedMotion() ? 0 : duration;
  },

  /**
   * Returns whether a variable is an array.
   *
   * @param {object} val
   * @return {boolean}
   * @deprecated
   */
  isArray: function (val: any): val is any[] {
    return Array.isArray(val);
  },

  /**
   * Returns whether a variable is a jQuery collection.
   *
   * @param {object} val
   * @return {boolean}
   */
  isJquery: function (val: any): val is JQuery {
    return val instanceof $;
  },

  /**
   * Returns whether a variable is a string.
   *
   * @param {object} val
   * @return {boolean}
   */
  isString: function (val: any): val is string {
    return typeof val === 'string';
  },

  /**
   * Returns whether an element has an attribute.
   *
   * @see http://stackoverflow.com/questions/1318076/jquery-hasattr-checking-to-see-if-there-is-an-attribute-on-an-element/1318091#1318091
   */
  hasAttr: function (elem: ElementOrJQuery, attr: string): boolean {
    const val = $(elem).attr(attr);
    return typeof val !== 'undefined' && val !== false;
  },

  /**
   * Returns whether something is a text node.
   *
   * @param {object} elem
   * @return {boolean}
   */
  isTextNode: function (elem: any): boolean {
    return elem.nodeType === Garnish.TEXT_NODE;
  },

  /**
   * Returns the offset of an element within the scroll container, whether that's the window or something else
   */
  getOffset: function (elem: ElementOrJQuery): Offset {
    let offset = $(elem).offset()!;

    if (Garnish.$scrollContainer[0] !== Garnish.$win[0]) {
      offset.top += Garnish.$scrollContainer.scrollTop()!;
      offset.left += Garnish.$scrollContainer.scrollLeft()!;
    }

    return offset;
  },

  /**
   * Returns the distance between two coordinates.
   *
   * @param {number} x1 The first coordinate's X position.
   * @param {number} y1 The first coordinate's Y position.
   * @param {number} x2 The second coordinate's X position.
   * @param {number} y2 The second coordinate's Y position.
   * @return {number}
   */
  getDist: function (x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
  },

  /**
   * Returns whether an element is touching an x/y coordinate.
   *
   * @param {number}    x    The coordinate's X position.
   * @param {number}    y    The coordinate's Y position.
   * @param {object} elem Either an actual element or a jQuery collection.
   * @return {boolean}
   */
  hitTest: function (x: number, y: number, elem: ElementOrJQuery): boolean {
    const $elem = $(elem);
    const offset = $elem.offset()!;
    const x1 = offset.left;
    const y1 = offset.top;
    const x2 = x1 + $elem.outerWidth()!;
    const y2 = y1 + $elem.outerHeight()!;

    return x >= x1 && x < x2 && y >= y1 && y < y2;
  },

  /**
   * Returns whether the cursor is touching an element.
   *
   * @param {object} ev   The mouse event object containing pageX and pageY properties.
   * @param {object} elem Either an actual element or a jQuery collection.
   * @return {boolean}
   */
  isCursorOver: function (ev: MouseEvent, elem: ElementOrJQuery): boolean {
    return Garnish.hitTest(ev.pageX, ev.pageY, elem);
  },

  /**
   * Copies text styles from one element to another.
   *
   * @param {object} source The source element. Can be either an actual element or a jQuery collection.
   * @param {object} target The target element. Can be either an actual element or a jQuery collection.
   */
  copyTextStyles: function (
    source: ElementOrJQuery,
    target: ElementOrJQuery
  ): void {
    const $source = $(source);
    const $target = $(target);

    $target.css({
      fontFamily: $source.css('fontFamily'),
      fontSize: $source.css('fontSize'),
      fontWeight: $source.css('fontWeight'),
      letterSpacing: $source.css('letterSpacing'),
      lineHeight: $source.css('lineHeight'),
      textAlign: $source.css('textAlign'),
      textIndent: $source.css('textIndent'),
      whiteSpace: $source.css('whiteSpace'),
      wordSpacing: $source.css('wordSpacing'),
      wordWrap: $source.css('wordWrap'),
    });
  },

  /**
   * Adds modal ARIA and role attributes to a container
   *
   * @param {object} container The container element. Can be either an actual element or a jQuery collection.
   */
  addModalAttributes: function (container: ElementOrJQuery): void {
    $(container).attr({
      'aria-modal': 'true',
      role: 'dialog',
    });
  },

  /**
   * Hide immediate descendants of the body element from screen readers
   *
   */
  hideModalBackgroundLayers: function (): void {
    const topmostLayer = Garnish.uiLayerManager.currentLayer.$container.get(0);

    Garnish.$bod
      .children()
      .not('#notifications')
      .each(function (this: HTMLElement) {
        // If element is modal or already has jsAria class, do nothing
        if (Garnish.hasJsAriaClass(this) || this === topmostLayer) return;

        if (!Garnish.isScriptOrStyleElement(this)) {
          Garnish.ariaHide(this);
        }
      });
  },

  /**
   * Un-hide elements based on currently active layers
   *
   */
  resetModalBackgroundLayerVisibility: function (): void {
    const highestModalLayer = Garnish.uiLayerManager.highestModalLayer;
    const hiddenLayerClasses = [
      Garnish.JS_ARIA_CLASS,
      Garnish.JS_ARIA_TRUE_CLASS,
      Garnish.JS_ARIA_FALSE_CLASS,
    ];

    // If there is another modal, make it accessible to AT
    if (highestModalLayer) {
      highestModalLayer.$container
        .removeClass(hiddenLayerClasses)
        .removeAttr('aria-hidden');
      return;
    }

    // If no more modals in DOM, loop through hidden elements and un-hide them
    const hiddenLayerSelector = hiddenLayerClasses
      .map((name: string) => '.' + name)
      .join(', ');
    const hiddenElements = $(hiddenLayerSelector);

    $(hiddenElements).each(function (this: HTMLElement) {
      if ($(this).hasClass(Garnish.JS_ARIA_CLASS)) {
        $(this).removeClass(Garnish.JS_ARIA_CLASS);
        $(this).removeAttr('aria-hidden');
      } else if ($(this).hasClass(Garnish.JS_ARIA_FALSE_CLASS)) {
        $(this).removeClass(Garnish.JS_ARIA_FALSE_CLASS);
        $(this).attr('aria-hidden', 'false');
      } else if ($(this).hasClass(Garnish.JS_ARIA_TRUE_CLASS)) {
        $(this).removeClass(Garnish.JS_ARIA_TRUE_CLASS);
        $(this).attr('aria-hidden', 'true');
      }
    });
  },

  /**
   * Apply aria-hidden="true" to element and store previous value as class
   *
   * @param {object} element The element. Can be either an actual element or a jQuery collection.
   */
  ariaHide: function (element: ElementOrJQuery): void {
    const ariaHiddenAttribute = $(element).attr('aria-hidden');

    // Capture initial aria-hidden values in an applied class
    if (!ariaHiddenAttribute) {
      $(element).addClass(Garnish.JS_ARIA_CLASS);
    } else if (ariaHiddenAttribute === 'false') {
      $(element).addClass(Garnish.JS_ARIA_FALSE_CLASS);
    } else if (ariaHiddenAttribute === 'true') {
      $(element).addClass(Garnish.JS_ARIA_TRUE_CLASS);
    }

    $(element).attr('aria-hidden', 'true');
  },

  /**
   * Checks to see if element is <script> or <style>
   *
   * @param {object} element The element. Can be either an actual element or a jQuery collection.
   * @return {boolean}
   */
  isScriptOrStyleElement: function (element: ElementOrJQuery): boolean {
    return (
      $(element).prop('tagName') === 'SCRIPT' ||
      $(element).prop('tagName') === 'STYLE'
    );
  },

  /**
   * Has been hidden from screen reader users as a result of modal open
   *
   * @param {object} element The element. Can be either an actual element or a jQuery collection.
   */
  hasJsAriaClass: function (element: ElementOrJQuery): boolean {
    return (
      $(element).hasClass(Garnish.JS_ARIA_CLASS) ||
      $(element).hasClass(Garnish.JS_ARIA_FALSE_CLASS) ||
      $(element).hasClass(Garnish.JS_ARIA_TRUE_CLASS)
    );
  },

  /**
   * Checks whether focus is inside a given container
   * @param {Object} container
   */
  focusIsInside: function (container: ElementOrJQuery): boolean {
    return $(container).find(':focus').length > 0;
  },

  /**
   * Gets the first focusable element inside a container
   * @param {Object} container
   */
  firstFocusableElement: function (container: ElementOrJQuery): JQuery {
    return $(container).find(':focusable').first();
  },

  /**
   * Returns a collection of all keyboard focusable-elements inside a container
   * @param {object} container
   * @return {object} A collection of keyboard-focusable elements
   */
  getKeyboardFocusableElements: function (container: ElementOrJQuery): JQuery {
    const $focusable = $(container).find(':focusable');
    const $keyboardFocusable = $focusable.filter(
      (index: number, element: HTMLElement) => {
        return Garnish.isKeyboardFocusable(element);
      }
    );

    return $keyboardFocusable;
  },

  /**
   * Returns whether the element is focusable by keyboard (i.e. does not have tabindex of -1)
   * @param {object} element
   * @return {boolean}
   */
  isKeyboardFocusable: function (element: ElementOrJQuery): boolean {
    let keyboardFocusable: boolean;

    if (!$(element).is(':focusable') || $(element).attr('tabindex') === '-1') {
      keyboardFocusable = false;
    } else {
      keyboardFocusable = true;
    }

    return keyboardFocusable;
  },

  /**
   * Traps focus within a container, so when focus is tabbed out of it, it's cycled back into it.
   * @param {Object} container
   */
  trapFocusWithin: function (container: ElementOrJQuery): void {
    const $container = $(container);
    Garnish.releaseFocusWithin($container);
    $container.on('keydown.focus-trap', function (ev: JQuery.KeyDownEvent) {
      if (ev.keyCode === Garnish.TAB_KEY) {
        const $focusableElements = $container.find(':focusable');
        const index = $focusableElements.index(ev.target);

        // Exit focus trap if no focusable elements are inside
        if ($focusableElements.length === 0) return;

        if (index === 0 && ev.shiftKey) {
          ev.preventDefault();
          ev.stopPropagation();
          $focusableElements.last().focus();
        } else if (index === $focusableElements.length - 1 && !ev.shiftKey) {
          ev.preventDefault();
          ev.stopPropagation();
          $focusableElements.first().focus();
        }
      }
    });
  },

  /**
   * Releases focus within a container.
   * @param {Object} container
   */
  releaseFocusWithin: function (container: ElementOrJQuery): void {
    $(container).off('.focus-trap');
  },

  /**
   * Sets focus to the first focusable element within a container, or on the container itself.
   * @param {Object} container The container element. Can be either an actual element or a jQuery collection.
   */
  setFocusWithin: function (container: ElementOrJQuery): void {
    const $container = $(container);
    if ($container.has(document.activeElement).length) {
      return;
    }

    let $firstFocusable = $container.find(
      ':focusable:not(.checkbox):not(.prevent-autofocus):first'
    );

    // if the first visible .field container is not the parent of the first focusable element we found
    // just focus on the container;
    // this can happen if e.g. you have an entry without a title and the first field is a ckeditor field;
    // in such case the second (or further) element would get focus on initial load, which can be confusing
    // see https://github.com/craftcms/cms/issues/15245
    if (
      $container.find('.field:visible:first')[0] !==
      $firstFocusable.parents('.field')[0]
    ) {
      $firstFocusable = $();
    }

    if ($firstFocusable.length > 0) {
      $firstFocusable.focus();
    } else {
      $container.attr('tabindex', '-1').focus();
    }
  },

  getFocusedElement: function (): JQuery {
    return $(':focus');
  },

  /**
   * Handles keyboard activation of non-semantic buttons
   * @param {Object} event The keypress event
   * @param {Object} callback The callback to perform if SPACE or ENTER keys are pressed on the non-semantic button
   * @deprecated The `activate` event should be used instead
   */
  handleActivatingKeypress: function (
    event: KeyboardEvent,
    callback: () => void
  ): void {
    const key = event.keyCode;

    if (key === Garnish.SPACE_KEY || key === Garnish.RETURN_KEY) {
      event.preventDefault();
      callback();
    }
  },

  /**
   * Returns the body's real scrollTop, discarding any window banding in Safari.
   *
   * @return {number}
   */
  getBodyScrollTop: function (): number {
    let scrollTop = document.body.scrollTop;

    if (scrollTop < 0) {
      scrollTop = 0;
    } else {
      const maxScrollTop = Garnish.$bod.outerHeight()! - Garnish.$win.height()!;

      if (scrollTop > maxScrollTop) {
        scrollTop = maxScrollTop;
      }
    }

    return scrollTop;
  },

  requestAnimationFrame: (function (): (fn: () => void) => number {
    const raf =
      window.requestAnimationFrame ||
      (window as any).mozRequestAnimationFrame ||
      (window as any).webkitRequestAnimationFrame ||
      function (fn: () => void): number {
        return window.setTimeout(fn, 20);
      };

    return function (fn: () => void): number {
      return raf(fn);
    };
  })(),

  cancelAnimationFrame: (function (): (id: number) => void {
    const cancel =
      window.cancelAnimationFrame ||
      (window as any).mozCancelAnimationFrame ||
      (window as any).webkitCancelAnimationFrame ||
      window.clearTimeout;

    return function (id: number): void {
      return cancel(id);
    };
  })(),

  /**
   * Scrolls a container element to an element within it.
   *
   * @param {object} container Either an actual element or a jQuery collection.
   * @param {object} elem      Either an actual element or a jQuery collection.
   */
  scrollContainerToElement: function (
    container: ElementOrJQuery,
    elem?: ElementOrJQuery
  ): void {
    let $elem: JQuery;
    let $container: JQuery;

    if (typeof elem === 'undefined') {
      $elem = $(container);
      $container = $elem.scrollParent();
    } else {
      $container = $(container);
      $elem = $(elem);
    }

    if (
      $container.prop('nodeName') === 'HTML' ||
      $container[0] === Garnish.$doc[0]
    ) {
      $container = Garnish.$win;
    }

    const scrollTop = $container.scrollTop()!;
    const elemOffset = $elem.offset()!.top;

    let elemScrollOffset: number;

    if ($container[0] === window) {
      elemScrollOffset = elemOffset - scrollTop;
    } else {
      elemScrollOffset = elemOffset - $container.offset()!.top;
    }

    let targetScrollTop: number | false = false;

    // Is the element above the fold?
    if (elemScrollOffset < 0) {
      targetScrollTop = scrollTop + elemScrollOffset - 10;
    } else {
      const elemHeight = $elem.outerHeight()!;
      const containerHeight =
        $container[0] === window
          ? window.innerHeight
          : ($container[0] as HTMLElement).clientHeight;

      // Is it below the fold?
      if (elemScrollOffset + elemHeight > containerHeight) {
        targetScrollTop =
          scrollTop + (elemScrollOffset - (containerHeight - elemHeight)) + 10;
      }
    }

    if (targetScrollTop !== false) {
      // Velocity only allows you to scroll to an arbitrary position if you're scrolling the main window
      if ($container[0] === window) {
        $('html').velocity('scroll', {
          offset: targetScrollTop + 'px',
          mobileHA: false,
        });
      } else {
        $container.scrollTop(targetScrollTop);
      }
    }
  },

  SHAKE_STEPS: 10,
  SHAKE_STEP_DURATION: 25,

  /**
   * Shakes an element.
   *
   * @param {object}  elem Either an actual element or a jQuery collection.
   * @param {string} prop The property that should be adjusted (default is 'margin-left').
   */
  shake: function (elem: ElementOrJQuery, prop?: string): void {
    const $elem = $(elem);

    if (!prop) {
      prop = 'margin-left';
    }

    let startingPoint = parseInt($elem.css(prop));
    if (isNaN(startingPoint)) {
      startingPoint = 0;
    }

    for (let i = 0; i <= Garnish.SHAKE_STEPS; i++) {
      (function (i: number) {
        setTimeout(function () {
          const properties: {[key: string]: number} = {};
          properties[prop!] = startingPoint + (i % 2 ? -1 : 1) * (10 - i);
          $elem.velocity(properties, Garnish.SHAKE_STEP_DURATION);
        }, Garnish.SHAKE_STEP_DURATION * i);
      })(i);
    }
  },

  /**
   * Returns the first element in an array or jQuery collection.
   *
   * @param {object} elem
   * @return mixed
   */
  getElement: function (
    elem: ElementOrJQuery | ElementOrJQuery[]
  ): HTMLElement {
    return $.makeArray(elem)[0] as HTMLElement;
  },

  /**
   * Returns the beginning of an input's name= attribute value with any [bracktes] stripped out.
   *
   * @param {object} elem
   * @return string|null
   */
  getInputBasename: function (elem: ElementOrJQuery): string | null {
    const name = $(elem).attr('name');

    if (name) {
      return name.replace(/\[.*/, '');
    } else {
      return null;
    }
  },

  /**
   * Returns an input's value as it would be POSTed.
   * So unchecked checkboxes and radio buttons return null,
   * and multi-selects whose name don't end in "[]" only return the last selection
   *
   * @param {object} $input
   * @return {(string|string[])}
   */
  getInputPostVal: function ($input: JQuery): string | string[] | null {
    const type = $input.attr('type');
    const val = $input.val();

    // Is this an unchecked checkbox or radio button?
    if (type === 'checkbox' || type === 'radio') {
      if ($input.prop('checked')) {
        return val as string;
      }
      return null;
    }

    // Flatten any array values whose input name doesn't end in "[]"
    //  - e.g. a multi-select
    if (Array.isArray(val) && $input.attr('name')!.slice(-2) !== '[]') {
      if (val.length) {
        return val[val.length - 1];
      }
      return null;
    }

    // If it's a dropdown with a null value, return an empty string instead
    // (consistent with element.value)
    if (val === null && $input.prop('nodeName') === 'SELECT') {
      return '';
    }

    // Just return the value
    return val as string | string[];
  },

  /**
   * Returns the inputs within a container
   *
   * @param {object} container The container element. Can be either an actual element or a jQuery collection.
   * @return {object}
   */
  findInputs: function (container: ElementOrJQuery): JQuery {
    return $(container).find('input,text,textarea,select,button');
  },

  /**
   * Returns the post data within a container.
   *
   * @param {object} container
   * @return {array}
   */
  getPostData: function (container: ElementOrJQuery): PostData {
    const postData: PostData = {};
    const arrayInputCounters: {[key: string]: number} = {};
    const $inputs = Garnish.findInputs(container);

    let inputName: string;

    for (let i = 0; i < $inputs.length; i++) {
      const $input = $inputs.eq(i);

      if ($input.prop('disabled')) {
        continue;
      }

      inputName = $input.attr('name')!;
      if (!inputName) {
        continue;
      }

      let inputVal = Garnish.getInputPostVal($input);
      if (inputVal === null) {
        continue;
      }

      const isArrayInput = inputName.slice(-2) === '[]';
      let croppedName: string;

      if (isArrayInput) {
        // Get the cropped input name
        croppedName = inputName.substring(0, inputName.length - 2);

        // Prep the input counter
        if (typeof arrayInputCounters[croppedName] === 'undefined') {
          arrayInputCounters[croppedName] = 0;
        }
      }

      if (!Array.isArray(inputVal)) {
        inputVal = [inputVal];
      }

      for (let j = 0; j < inputVal.length; j++) {
        if (isArrayInput) {
          inputName =
            croppedName! + '[' + arrayInputCounters[croppedName!] + ']';
          arrayInputCounters[croppedName!]++;
        }

        postData[inputName] = inputVal[j];
      }
    }

    return postData;
  },

  copyInputValues: function (
    source: ElementOrJQuery,
    target: ElementOrJQuery
  ): void {
    const $sourceInputs = Garnish.findInputs(source);
    const $targetInputs = Garnish.findInputs(target);

    for (let i = 0; i < $sourceInputs.length; i++) {
      if (typeof $targetInputs[i] === 'undefined') {
        break;
      }

      const $targetInput = $targetInputs.eq(i);
      if ($targetInput.attr('type') !== 'file') {
        $targetInputs.eq(i).val($sourceInputs.eq(i).val()!);
      }
    }
  },

  /**
   * Returns whether a mouse event is for the primary mouse button.
   *
   * @param ev The mouse event
   * @return {boolean}
   */
  isPrimaryClick: function (ev: MouseEvent): boolean {
    return ev.which === Garnish.PRIMARY_CLICK && !ev.ctrlKey && !ev.metaKey;
  },

  /**
   * Returns whether the "Ctrl" key is pressed (or ⌘ if this is a Mac) for a given keyboard event
   *
   * @param ev The keyboard event
   *
   * @return {boolean} Whether the "Ctrl" key is pressed
   */
  isCtrlKeyPressed: function (ev: KeyboardEvent): boolean {
    if (window.navigator.platform.match(/Mac/)) {
      // metaKey maps to ⌘ on Macs
      return ev.metaKey;
    }
    return ev.ctrlKey;
  },

  _eventHandlers: [],

  _normalizeEvents: function (events: string | string[]): string[][] {
    if (typeof events === 'string') {
      events = events.split(' ');
    }

    const normalizedEvents: string[][] = [];
    for (let i = 0; i < events.length; i++) {
      if (typeof events[i] === 'string') {
        normalizedEvents.push((events[i] as string).split('.'));
      } else {
        normalizedEvents.push(events[i] as unknown as string[]);
      }
    }

    return normalizedEvents;
  },

  on: function (
    target: any,
    events: string | string[],
    data?: any,
    handler?: (event: any) => void
  ): void {
    if (typeof target === 'undefined') {
      console.warn('Garnish.on() called for an invalid target class.');
      return;
    }

    if (typeof data === 'function') {
      handler = data;
      data = {};
    }

    const normalizedEvents = Garnish._normalizeEvents(events);

    for (let i = 0; i < normalizedEvents.length; i++) {
      const ev = normalizedEvents[i];
      Garnish._eventHandlers.push({
        target: target,
        type: ev[0],
        namespace: ev[1],
        data: data,
        handler: handler!,
      });
    }
  },

  off: function (
    target: any,
    events: string | string[],
    handler: (event: any) => void
  ): void {
    const normalizedEvents = Garnish._normalizeEvents(events);

    for (let i = 0; i < normalizedEvents.length; i++) {
      const ev = normalizedEvents[i];

      for (let j = Garnish._eventHandlers.length - 1; j >= 0; j--) {
        const eventHandler = Garnish._eventHandlers[j];

        if (
          eventHandler.target === target &&
          eventHandler.type === ev[0] &&
          (!ev[1] || eventHandler.namespace === ev[1]) &&
          eventHandler.handler === handler
        ) {
          Garnish._eventHandlers.splice(j, 1);
        }
      }
    }
  },

  once: function (
    target: any,
    events: string | string[],
    data?: any,
    handler?: (event: any) => void
  ): void {
    if (typeof target === 'undefined') {
      console.warn('Garnish.once() called for an invalid target class.');
      return;
    }

    if (typeof data === 'function') {
      handler = data;
      data = {};
    }

    const onceler = (event: any) => {
      Garnish.off(target, events, onceler);
      handler!(event);
    };
    Garnish.on(target, events, data, onceler);
  },

  muteResizeEvents: function (callback: () => void): void {
    const resizeEventsMuted = Garnish.resizeEventsMuted;
    Garnish.resizeEventsMuted = true;
    callback();
    Garnish.resizeEventsMuted = resizeEventsMuted;
  },

  /**
   * Ensures that the given number is within a min/max range, and returns it.
   *
   * @param {number} num
   * @param {number} min
   * @param {number} max
   */
  within: function (num: number, min: number, max: number): number {
    num = Math.max(num, min);
    num = Math.min(num, max);
    return num;
  },

  // Component classes (will be assigned after declaration)
  Base: null,
  BaseDrag: null,
  CheckboxSelect: null,
  ContextMenu: null,
  CustomSelect: null,
  DisclosureMenu: null,
  Drag: null,
  DragDrop: null,
  DragMove: null,
  DragSort: null,
  EscManager: null,
  HUD: null,
  MenuBtn: null,
  MixedInput: null,
  Modal: null,
  MultiFunctionBtn: null,
  NiceText: null,
  Select: null,
  SelectMenu: null,
  UiLayerManager: null,
  Menu: null, // deprecated alias
  ShortcutManager: null, // deprecated alias
  uiLayerManager: null,
});

Object.assign(Garnish, {
  Base,
  BaseDrag,
  CheckboxSelect,
  ContextMenu,
  CustomSelect,
  DisclosureMenu,
  Drag,
  DragDrop,
  DragMove,
  DragSort,
  EscManager,
  HUD,
  MenuBtn,
  MixedInput,
  Modal,
  MultiFunctionBtn,
  NiceText,
  Select,
  SelectMenu,
  UiLayerManager,
  /**
   * @deprecated Use CustomSelect instead.
   */
  Menu: CustomSelect,
  /**
   * @deprecated Use UiLayerManager instead.
   */
  ShortcutManager: UiLayerManager,
});

// Custom events
// -----------------------------------------------------------------------------

let resizeObserver: ResizeObserver | undefined;
/**
 * @returns {ResizeObserver}
 */
function getResizeObserver(): ResizeObserver {
  return (resizeObserver =
    resizeObserver ||
    new ResizeObserver((entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        const size = $.data(entry.target, 'size');
        if (size) {
          const {width, height} = entry.target.getBoundingClientRect();
          if (width !== size.width || height !== size.height) {
            $.data(entry.target, 'size', {width, height});
            if (!Garnish.resizeEventsMuted) {
              $(entry.target).trigger('resize');
            }
          }
        }
      }
    }));
}

// Work them into jQuery's event system
$.extend($.event.special, {
  activate: {
    setup: function (
      this: HTMLElement,
      data: any,
      namespaces: string[],
      eventHandle: (event: Event) => void
    ) {
      const $elem = $(this);

      $elem.on({
        'mousedown.garnish-activate': function (e: JQuery.MouseDownEvent) {
          // Prevent buttons from getting focus on click
          if (
            (e.currentTarget as HTMLElement).nodeName === 'BUTTON' ||
            (e.currentTarget as HTMLElement).getAttribute('role') === 'button'
          ) {
            e.preventDefault();
          }
        },
        'click.garnish-activate': function (e: JQuery.ClickEvent) {
          // Ignore if activate events are muted
          if (Garnish.activateEventsMuted) {
            return;
          }

          const disabled = $elem.hasClass('disabled');

          // Don't interfere if this is a link and it was a Ctrl-click
          if (
            !disabled &&
            $elem.prop('nodeName') === 'A' &&
            Garnish.hasAttr($elem, 'href') &&
            !['#', ''].includes($elem.attr('href')!) &&
            Garnish.isCtrlKeyPressed(e as any)
          ) {
            return;
          }

          if (
            (e.currentTarget as HTMLElement).nodeName === 'BUTTON' ||
            (e.currentTarget as HTMLElement).getAttribute('role') === 'button'
          ) {
            e.preventDefault();
          }

          if (!disabled) {
            $elem.trigger({
              type: 'activate',
              originalEvent: e,
            });
          }
        },
        'keydown.garnish-activate': function (e: JQuery.KeyDownEvent) {
          // Ignore if activate events are muted, or the event was bubbled up, or if it wasn't the Space/Return key
          if (
            Garnish.activateEventsMuted ||
            this !== $elem[0] ||
            ![Garnish.SPACE_KEY, Garnish.RETURN_KEY].includes(e.keyCode!)
          ) {
            return;
          }

          if (
            (e.currentTarget as HTMLElement).nodeName === 'BUTTON' ||
            (e.currentTarget as HTMLElement).getAttribute('role') === 'button'
          ) {
            e.preventDefault();
          }

          if (!$elem.hasClass('disabled')) {
            $elem.trigger({
              type: 'activate',
              originalEvent: e,
            });
          }
        },
      });

      if (!$elem.hasClass('disabled')) {
        $elem.attr('tabindex', '0');
      } else {
        $elem.removeAttr('tabindex');
      }
    },
    teardown: function (this: HTMLElement) {
      $(this).off('.garnish-activate');
    },
  },

  textchange: {
    setup: function (
      this: HTMLElement,
      data: any,
      namespaces: string[],
      eventHandle: (event: Event) => void
    ) {
      const $elem = $(this);
      $elem.data('garnish-textchange-value', $elem.val());
      $elem.on(
        'keypress.garnish-textchange keyup.garnish-textchange change.garnish-textchange blur.garnish-textchange',
        function (e: JQuery.Event) {
          const val = $elem.val();
          if (val !== $elem.data('garnish-textchange-value')) {
            $elem.data('garnish-textchange-value', val);
            $elem.trigger('textchange');
          }
        }
      );
    },
    teardown: function (this: HTMLElement) {
      $(this).off('.garnish-textchange');
    },
    handle: function (ev: any, data: any) {
      const el = this;
      const args = arguments;
      const delay = data?.delay ?? ev?.data?.delay ?? null;
      const handleObj = ev.handleObj;
      const targetData = $.data(ev.target);

      // Was this event configured with a delay?
      if (delay) {
        if (targetData.delayTimeout) {
          clearTimeout(targetData.delayTimeout);
        }

        targetData.delayTimeout = setTimeout(function () {
          handleObj.handler.apply(el, args);
        }, delay);
      } else {
        return handleObj.handler.apply(el, args);
      }
    },
  },

  resize: {
    setup: function (
      this: HTMLElement | Window,
      data: any,
      namespaces: string[],
      eventHandle: (event: Event) => void
    ) {
      // window is the only element that natively supports a resize event
      if (this === window) {
        return false;
      }

      const {width, height} = (this as HTMLElement).getBoundingClientRect();
      $.data(this, 'size', {width, height});
      getResizeObserver().observe(this as HTMLElement);
    },
    teardown: function (this: HTMLElement | Window) {
      if (this === window) {
        return false;
      }

      getResizeObserver().unobserve(this as HTMLElement);
    },
  },
});

// Give them their own element collection chaining methods
$.each(
  ['activate', 'textchange', 'resize'],
  function (i: number, name: string) {
    ($.fn as any)[name] = function (data?: any, fn?: (event: any) => void) {
      return arguments.length > 0
        ? this.on(name, null, data, fn)
        : this.trigger(name);
    };
  }
);

// Make Garnish available globally
(window as any).Garnish = Garnish;

export default Garnish;
