/*!
	Base.ts, version 1.1a
	Copyright 2006-2010, Dean Edwards
	License: http://www.opensource.org/licenses/mit-license.php
*/

// Type definitions for the Base class system
interface BaseConstructor {
  new (...args: any[]): BaseInstance;
  extend(
    instance?: Record<string, any>,
    staticMethods?: Record<string, any>
  ): BaseConstructor;
  forEach(
    object: Record<string, any>,
    block: (value: any, key: string, object: Record<string, any>) => void,
    context?: any
  ): void;
  implement(...interfaces: (Function | Record<string, any>)[]): BaseConstructor;
  ancestor: BaseConstructor;
  prototype: BaseInstance;
  toString(): string;
  valueOf(type?: string): any;
  init?(): void;
  version: string;
  _prototyping?: boolean;
}

interface BaseInstance {
  extend(source: string, value: any): this;
  extend(source: Record<string, any>): this;
  extend(source: string | Record<string, any>, value?: any): this;
  base?: Function;
  _constructing?: boolean;
  constructor: BaseConstructor;
}

interface BaseStatic extends BaseConstructor {
  _prototyping?: boolean;
}

let Base: BaseStatic = function (this: BaseInstance) {
  // dummy
} as any;

Base.extend = function (
  this: BaseConstructor,
  _instance?: Record<string, any>,
  _static?: Record<string, any>
): BaseConstructor {
  // subclass
  const extend = Base.prototype.extend;

  // build the prototype
  Base._prototyping = true;
  const proto = new this() as BaseInstance;
  if (_instance) {
    extend.call(proto, _instance);
  }
  proto.base = function (this: BaseInstance) {
    // call this method from any other method to invoke that method's ancestor
  };
  delete Base._prototyping;

  // create the wrapper for the constructor function
  const constructor = proto.constructor;
  const klass = (proto.constructor = function (
    this: BaseInstance,
    ...args: any[]
  ) {
    if (!Base._prototyping) {
      if (this._constructing || this.constructor === klass) {
        // instantiation
        this._constructing = true;
        constructor.apply(this, args);
        delete this._constructing;
      } else if (args[0] != null) {
        // casting
        return (args[0].extend || extend).call(args[0], proto);
      }
    }
  } as any) as BaseConstructor;

  // build the class interface
  klass.ancestor = this;
  klass.extend = this.extend;
  klass.forEach = this.forEach;
  klass.implement = this.implement;
  klass.prototype = proto;
  klass.toString = this.toString;
  klass.valueOf = function (type?: string): any {
    return type === 'object' ? klass : constructor.valueOf();
  };
  extend.call(klass, _static || {});
  // class initialisation
  if (typeof klass.init === 'function') klass.init();
  return klass;
};

Base.prototype = {
  extend: function (
    this: BaseInstance,
    source: string | Record<string, any>,
    value?: any
  ): BaseInstance {
    if (arguments.length > 1) {
      // extending with a name/value pair
      const sourceKey = source as string;
      const ancestor = (this as any)[sourceKey];
      if (
        ancestor &&
        typeof value === 'function' && // overriding a method?
        // the valueOf() comparison is to avoid circular references
        (!ancestor.valueOf || ancestor.valueOf() !== value.valueOf()) &&
        /\bbase\b/.test(value.toString())
      ) {
        // get the underlying method
        const method = value.valueOf();
        // override
        value = function (this: BaseInstance, ...args: any[]): any {
          const previous = this.base || Base.prototype.base;
          this.base = ancestor;
          const returnValue = method.apply(this, args);
          this.base = previous;
          return returnValue;
        };
        // point to the underlying method
        value.valueOf = function (type?: string): any {
          return type === 'object' ? value : method;
        };
        value.toString = Base.toString;
      }
      (this as any)[sourceKey] = value;
    } else if (source) {
      // extending with an object literal
      const sourceObj = source as Record<string, any>;
      let extend = Base.prototype.extend;
      // if this object has a customised extend method then use it
      if (!Base._prototyping && typeof this !== 'function') {
        extend = (this as any).extend || extend;
      }
      const proto = {toSource: null};
      // do the "toString" and other methods manually
      const hidden = ['constructor', 'toString', 'valueOf'];
      // if we are prototyping then include the constructor
      let i = Base._prototyping ? 0 : 1;
      let key: string;
      while ((key = hidden[i++])) {
        if (sourceObj[key] !== (proto as any)[key]) {
          extend.call(this, key, sourceObj[key]);
        }
      }
      // copy each of the source object's properties to this object
      for (const key in sourceObj) {
        if (!(proto as any)[key]) {
          const desc = Object.getOwnPropertyDescriptor(sourceObj, key);
          if (desc && typeof desc.value !== 'undefined') {
            // set the value normally in case it's a function that needs to be overwritten
            extend.call(this, key, desc.value);
          } else if (desc) {
            // set it while maintaining the original descriptor settings
            Object.defineProperty(this, key, desc);
          }
        }
      }
    }
    return this;
  },
} as BaseInstance;

// initialise
Base = Base.extend(
  {
    constructor: function (this: BaseInstance, ...args: any[]) {
      this.extend(args[0]);
    },
  },
  {
    ancestor: Object,
    version: '1.1',

    forEach: function (
      object: Record<string, any>,
      block: (value: any, key: string, object: Record<string, any>) => void,
      context?: any
    ): void {
      for (const key in object) {
        if ((this.prototype as any)[key] === undefined) {
          block.call(context, object[key], key, object);
        }
      }
    },

    implement: function (
      this: BaseConstructor,
      ...interfaces: (Function | Record<string, any>)[]
    ): BaseConstructor {
      for (let i = 0; i < interfaces.length; i++) {
        if (typeof interfaces[i] === 'function') {
          // if it's a function, call it
          (interfaces[i] as Function)(this.prototype);
        } else {
          // add the interface using the extend method
          this.prototype.extend(interfaces[i] as Record<string, any>);
        }
      }
      return this;
    },

    toString: function (): string {
      return String(this.valueOf());
    },
  }
);

export default Base;
export type {BaseConstructor, BaseInstance, BaseStatic};
