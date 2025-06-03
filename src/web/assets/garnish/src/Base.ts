import Base from './lib/Base';
import Garnish from './Garnish';
import $ from 'jquery';

// Type definitions for the Garnish Base class
interface GarnishEvent {
  type: string;
  target: any;
  data?: any;
}

interface EventHandler {
  type: string;
  namespace?: string;
  data: any;
  handler: (event: GarnishEvent) => void;
}

interface GarnishBaseSettings {
  [key: string]: any;
}

interface GarnishBase {
  settings: GarnishBaseSettings | null;
  _eventHandlers: EventHandler[];
  _namespace: string;
  _listeners: Element[];
  _disabled: boolean;

  init(...args: any[]): void;
  setSettings(
    settings?: GarnishBaseSettings,
    defaults?: GarnishBaseSettings
  ): void;
  on(events: string | string[], handler: (event: GarnishEvent) => void): void;
  on(
    events: string | string[],
    data: any,
    handler: (event: GarnishEvent) => void
  ): void;
  off(events: string | string[], handler: (event: GarnishEvent) => void): void;
  once(events: string | string[], handler: (event: GarnishEvent) => void): void;
  once(
    events: string | string[],
    data: any,
    handler: (event: GarnishEvent) => void
  ): void;
  trigger(type: string, data?: any): void;
  addListener(
    elem: Element | JQuery,
    events: string | string[],
    func: Function | string
  ): void;
  addListener(
    elem: Element | JQuery,
    events: string | string[],
    data: any,
    func: Function | string
  ): void;
  removeListener(elem: Element | JQuery, events: string | string[]): void;
  removeAllListeners(elem: Element | JQuery | Element[]): void;
  disable(): void;
  enable(): void;
  destroy(): void;
  _splitEvents(events: string | string[]): string[];
  _formatEvents(events: string | string[]): string;
}

/**
 * Garnish base class
 */
export default Base.extend({
  settings: null as GarnishBaseSettings | null,

  _eventHandlers: null as EventHandler[] | null,
  _namespace: null as string | null,
  _listeners: null as Element[] | null,
  _disabled: false,

  constructor: function (this: GarnishBase, ...args: any[]) {
    this._eventHandlers = [];
    this._namespace = '.Garnish' + Math.floor(Math.random() * 1000000000);
    this._listeners = [];
    this.init.apply(this, args);
  },

  init: $.noop as (...args: any[]) => void,

  setSettings: function (
    this: GarnishBase,
    settings?: GarnishBaseSettings,
    defaults?: GarnishBaseSettings
  ): void {
    const baseSettings =
      typeof this.settings === 'undefined' ? {} : this.settings;
    this.settings = $.extend({}, baseSettings, defaults, settings);
  },

  on: function (
    this: GarnishBase,
    events: string | string[],
    data?: any,
    handler?: (event: GarnishEvent) => void
  ): void {
    if (typeof data === 'function') {
      handler = data;
      data = {};
    }

    if (!handler) {
      return;
    }

    const normalizedEvents = Garnish._normalizeEvents(events);

    for (let i = 0; i < normalizedEvents.length; i++) {
      const ev = normalizedEvents[i];
      this._eventHandlers.push({
        type: ev[0],
        namespace: ev[1],
        data: data,
        handler: handler,
      });
    }
  },

  off: function (
    this: GarnishBase,
    events: string | string[],
    handler: (event: GarnishEvent) => void
  ): void {
    const normalizedEvents = Garnish._normalizeEvents(events);

    for (let i = 0; i < normalizedEvents.length; i++) {
      const ev = normalizedEvents[i];

      for (let j = this._eventHandlers.length - 1; j >= 0; j--) {
        const eventHandler = this._eventHandlers[j];

        if (
          eventHandler.type === ev[0] &&
          (!ev[1] || eventHandler.namespace === ev[1]) &&
          eventHandler.handler === handler
        ) {
          this._eventHandlers.splice(j, 1);
        }
      }
    }
  },

  once: function (
    this: GarnishBase,
    events: string | string[],
    data?: any,
    handler?: (event: GarnishEvent) => void
  ): void {
    if (typeof data === 'function') {
      handler = data;
      data = {};
    }

    if (!handler) {
      return;
    }

    const onceler = (event: GarnishEvent): void => {
      this.off(events, onceler);
      handler(event);
    };
    this.on(events, data, onceler);
  },

  trigger: function (this: GarnishBase, type: string, data?: any): void {
    const ev: GarnishEvent = {
      type: type,
      target: this,
    };

    // instance level event handlers
    this._eventHandlers
      .filter((handler) => handler.type === type)
      .forEach((handler) => {
        const _ev = $.extend({data: handler.data}, data, ev);
        handler.handler(_ev);
      });

    // class level event handlers
    Garnish._eventHandlers
      .filter(
        (handler) =>
          handler &&
          handler.target &&
          this instanceof handler.target &&
          handler.type === type
      )
      .forEach((handler) => {
        const _ev = $.extend({data: handler.data}, data, ev);
        handler.handler(_ev);
      });
  },

  _splitEvents: function (
    this: GarnishBase,
    events: string | string[]
  ): string[] {
    if (typeof events === 'string') {
      const eventsArray = events.split(',');

      for (let i = 0; i < eventsArray.length; i++) {
        eventsArray[i] = $.trim(eventsArray[i]);
      }

      return eventsArray;
    }

    return events;
  },

  _formatEvents: function (
    this: GarnishBase,
    events: string | string[]
  ): string {
    const eventsArray = this._splitEvents(events).slice(0);

    for (let i = 0; i < eventsArray.length; i++) {
      eventsArray[i] += this._namespace;
    }

    return eventsArray.join(' ');
  },

  addListener: function (
    this: GarnishBase,
    elem: Element | JQuery,
    events: string | string[],
    data?: any,
    func?: Function | string
  ): void {
    const $elem = $(elem);

    // Ignore if there aren't any elements
    if (!$elem.length) {
      return;
    }

    const eventsArray = this._splitEvents(events);

    // Param mapping
    if (typeof func === 'undefined' && typeof data !== 'object') {
      // (elem, events, func)
      func = data;
      data = {};
    }

    let boundFunc: Function;
    if (typeof func === 'function') {
      boundFunc = func.bind(this);
    } else if (typeof func === 'string') {
      boundFunc = (this as any)[func].bind(this);
    } else {
      return;
    }

    $elem.on(
      this._formatEvents(eventsArray),
      data,
      $.proxy(function (this: GarnishBase, ...args: any[]) {
        if (!this._disabled) {
          return boundFunc.apply(this, args);
        }
      }, this)
    );

    // Remember that we're listening to this element
    const elemArray = $elem.get();
    for (const element of elemArray) {
      if ($.inArray(element, this._listeners) === -1) {
        this._listeners.push(element);
      }
    }
  },

  removeListener: function (
    this: GarnishBase,
    elem: Element | JQuery,
    events: string | string[]
  ): void {
    $(elem).off(this._formatEvents(events));
  },

  removeAllListeners: function (
    this: GarnishBase,
    elem: Element | JQuery | Element[]
  ): void {
    $(elem).off(this._namespace);
  },

  disable: function (this: GarnishBase): void {
    this._disabled = true;
  },

  enable: function (this: GarnishBase): void {
    this._disabled = false;
  },

  destroy: function (this: GarnishBase): void {
    this.trigger('destroy');
    this.removeAllListeners(this._listeners);
  },
});

export type {GarnishBase, GarnishBaseSettings, GarnishEvent, EventHandler};
