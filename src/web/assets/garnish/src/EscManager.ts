import Garnish from './Garnish';
import Base from './Base';

interface EscHandler {
  obj: any;
  func: string | ((ev: KeyboardEvent) => void);
}

interface EscManagerInterface {
  handlers: EscHandler[] | null;

  init(): void;
  register(obj: any, func: string | ((ev: KeyboardEvent) => void)): void;
  unregister(obj: any): void;
  escapeLatest(ev: KeyboardEvent): void;
}

/**
 * ESC key manager class
 * @deprecated Use Garnish.ShortcutManager instead
 */
export default Base.extend({
  handlers: null,

  init: function (this: EscManagerInterface): void {
    this.handlers = [];

    this.addListener(
      Garnish.$bod,
      'keyup',
      function (this: EscManagerInterface, ev: KeyboardEvent) {
        if (ev.keyCode === Garnish.ESC_KEY) {
          this.escapeLatest(ev);
        }
      }
    );
  },

  register: function (
    this: EscManagerInterface,
    obj: any,
    func: string | ((ev: KeyboardEvent) => void)
  ): void {
    this.handlers!.push({
      obj: obj,
      func: func,
    });
  },

  unregister: function (this: EscManagerInterface, obj: any): void {
    for (let i = this.handlers!.length - 1; i >= 0; i--) {
      if (this.handlers![i].obj === obj) {
        this.handlers!.splice(i, 1);
      }
    }
  },

  escapeLatest: function (this: EscManagerInterface, ev: KeyboardEvent): void {
    if (this.handlers!.length) {
      const handler = this.handlers!.pop()!;

      let func: (ev: KeyboardEvent) => void;

      if (typeof handler.func === 'function') {
        func = handler.func;
      } else {
        func = handler.obj[handler.func];
      }

      func.call(handler.obj, ev);

      if (typeof handler.obj.trigger === 'function') {
        handler.obj.trigger('escape');
      }
    }
  },
});
