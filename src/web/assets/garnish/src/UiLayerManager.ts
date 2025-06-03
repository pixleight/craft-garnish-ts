import Garnish from './Garnish';
import Base from './Base';
import $ from 'jquery';
import type {
  UiLayerManagerInterface,
  UiLayer,
  UiLayerOptions,
  UiLayerShortcut,
  ElementOrJQuery,
  JQueryElement,
} from './types';

/**
 * UI Layer Manager class
 *
 * This is used to manage the visible UI "layers", including the base document, and any open modals, HUDs, slideouts, or menus.
 */
export default Base.extend<UiLayerManagerInterface>({
  layers: [] as UiLayer[],

  init(): void {
    this.layers = [
      {
        $container: (Garnish as any).$bod,
        shortcuts: [],
        options: {
          bubble: false,
        },
      },
    ];
    this.addListener((Garnish as any).$bod, 'keydown', 'triggerShortcut');
  },

  get layer(): number {
    return this.layers.length - 1;
  },

  get currentLayer(): UiLayer {
    return this.layers[this.layer];
  },

  get modalLayers(): UiLayer[] {
    return this.layers.filter((layer) => layer.isModal === true);
  },

  get highestModalLayer(): UiLayer | undefined {
    return this.modalLayers.pop();
  },

  /**
   * Registers a new UI layer.
   *
   * @param {jQuery|HTMLElement} [container]
   * @param {Object} [options]
   */
  addLayer(
    container?: ElementOrJQuery | UiLayerOptions,
    options?: UiLayerOptions
  ): this {
    if ($.isPlainObject(container)) {
      options = container as UiLayerOptions;
      container = undefined;
    }

    options = Object.assign(
      {
        bubble: false,
      },
      options || {}
    );

    const $container = container ? $(container as ElementOrJQuery) : null;

    this.layers.push({
      $container,
      shortcuts: [],
      isModal: $container ? $container.attr('aria-modal') === 'true' : false,
      options: options,
    });

    this.trigger('addLayer', {
      layer: this.layer,
      $container: this.currentLayer.$container,
      options: options,
    });

    return this;
  },

  removeLayer(layer?: ElementOrJQuery): this {
    if (this.layer === 0) {
      throw new Error("Can't remove the base layer.");
    }

    if (layer) {
      const layerIndex = this.getLayerIndex(layer);
      if (layerIndex !== undefined) {
        this.removeLayerAtIndex(layerIndex);
      }
    } else {
      this.layers.pop();
      this.trigger('removeLayer');
    }

    return this;
  },

  getLayerIndex(layer: ElementOrJQuery): number | undefined {
    const element = $(layer).get(0);
    let layerIndex: number | undefined;

    $(this.layers).each((index: number, layerData: UiLayer) => {
      if (
        layerData.$container !== null &&
        layerData.$container.get(0) === element
      ) {
        layerIndex = index;
        return false;
      }
    });

    return layerIndex;
  },

  removeLayerAtIndex(index: number): this {
    this.layers.splice(index, 1);
    this.trigger('removeLayer');
    return this;
  },

  registerShortcut(
    shortcut:
      | number
      | {keyCode: number; ctrl?: boolean; shift?: boolean; alt?: boolean},
    callback: (event: JQuery.KeyDownEvent) => void,
    layer?: number
  ): this {
    const normalizedShortcut = this._normalizeShortcut(shortcut);
    if (typeof layer === 'undefined') {
      layer = this.layer;
    }

    this.layers[layer].shortcuts.push({
      key: JSON.stringify(normalizedShortcut),
      shortcut: normalizedShortcut,
      callback: callback,
    });

    return this;
  },

  unregisterShortcut(
    shortcut:
      | number
      | {keyCode: number; ctrl?: boolean; shift?: boolean; alt?: boolean},
    layer?: number
  ): this {
    const normalizedShortcut = this._normalizeShortcut(shortcut);
    const key = JSON.stringify(normalizedShortcut);

    if (typeof layer === 'undefined') {
      layer = this.layer;
    }

    const index = this.layers[layer].shortcuts.findIndex((s) => s.key === key);
    if (index !== -1) {
      this.layers[layer].shortcuts.splice(index, 1);
    }

    return this;
  },

  _normalizeShortcut(
    shortcut:
      | number
      | {keyCode: number; ctrl?: boolean; shift?: boolean; alt?: boolean}
  ): {
    keyCode: number;
    ctrl: boolean;
    shift: boolean;
    alt: boolean;
  } {
    if (typeof shortcut === 'number') {
      shortcut = {keyCode: shortcut};
    }

    if (typeof shortcut.keyCode !== 'number') {
      throw 'Invalid shortcut';
    }

    return {
      keyCode: shortcut.keyCode,
      ctrl: !!shortcut.ctrl,
      shift: !!shortcut.shift,
      alt: !!shortcut.alt,
    };
  },

  triggerShortcut(ev: JQuery.KeyDownEvent, layerIndex?: number): void {
    if (typeof layerIndex === 'undefined') {
      layerIndex = this.layer;
    }

    const layer = this.layers[layerIndex];
    const shortcut = layer.shortcuts.find(
      (s) =>
        s.shortcut.keyCode === ev.keyCode &&
        s.shortcut.ctrl === (Garnish as any).isCtrlKeyPressed(ev) &&
        s.shortcut.shift === ev.shiftKey &&
        s.shortcut.alt === ev.altKey
    );

    (ev as any).bubbleShortcut = () => {
      if (layerIndex! > 0) {
        this.triggerShortcut(ev, layerIndex! - 1);
      }
    };

    if (shortcut) {
      ev.preventDefault();
      shortcut.callback(ev);
    } else if (layer.options.bubble) {
      (ev as any).bubbleShortcut();
    }
  },
});
