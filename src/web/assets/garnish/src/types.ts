// Type definitions for Garnish library
import $ from 'jquery';

export interface GarnishEventHandler {
  target: any;
  type: string;
  namespace?: string;
  data?: any;
  handler: (event: any) => void;
}

export interface GarnishEvent {
  type: string;
  target: any;
  data?: any;
  originalEvent?: Event;
}

export interface PostData {
  [key: string]: string | string[];
}

export interface Coordinates {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Offset {
  top: number;
  left: number;
}

export type JQueryElement = JQuery<HTMLElement>;
export type ElementOrJQuery = HTMLElement | JQueryElement;

// Key code constants
export const KeyCodes = {
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
} as const;

// Mouse button constants
export const MouseButtons = {
  PRIMARY_CLICK: 1,
  SECONDARY_CLICK: 3,
} as const;

// Axis constants
export const Axes = {
  X_AXIS: 'x',
  Y_AXIS: 'y',
} as const;

export type Axis = (typeof Axes)[keyof typeof Axes];

// BaseDrag interfaces and types
export interface BaseDragSettings {
  minMouseDist?: number;
  handle?: string | JQueryElement | null;
  axis?: Axis | null;
  ignoreHandleSelector?: string;
  onBeforeDragStart?: () => void;
  onDragStart?: () => void;
  onDrag?: () => void;
  onDragStop?: () => void;
}

export interface BaseDragInterface {
  $items: JQueryElement;
  dragging: boolean;
  mousedownX: number | null;
  mousedownY: number | null;
  realMouseX: number | null;
  realMouseY: number | null;
  mouseX: number | null;
  mouseY: number | null;
  mouseDistX: number | null;
  mouseDistY: number | null;
  mouseOffsetX: number | null;
  mouseOffsetY: number | null;
  $targetItem: JQueryElement | null;
  scrollProperty: string | null;
  scrollAxis: string | null;
  scrollDist: number | null;
  scrollFrame: number | null;
  settings: BaseDragSettings;
  _: any;

  init(
    items?: ElementOrJQuery | BaseDragSettings,
    settings?: BaseDragSettings
  ): void;
  allowDragging(): boolean;
  startDragging(): void;
  setScrollContainer(): void;
  isScrollingWindow(): boolean;
  drag(didMouseMove?: boolean): void;
  stopDragging(): void;
  addItems(items: ElementOrJQuery): void;
  removeItems(items: ElementOrJQuery): void;
  removeAllItems(): void;
  destroy(): void;
  onBeforeDragStart(): void;
  onDragStart(): void;
  onDrag(): void;
  onDragStop(): void;
}

// Drag interfaces and types
export interface DragSettings extends BaseDragSettings {
  filter?: string | (() => JQueryElement) | null;
  singleHelper?: boolean;
  collapseDraggees?: boolean;
  removeDraggee?: boolean;
  hideDraggee?: boolean;
  copyDraggeeInputValuesToHelper?: boolean;
  helperOpacity?: number;
  moveHelperToCursor?: boolean;
  helper?:
    | string
    | ((helper: JQueryElement, index: number) => JQueryElement)
    | null;
  helperBaseZindex?: number;
  helperLagBase?: number;
  helperLagIncrementDividend?: number;
  helperSpacingX?: number;
  helperSpacingY?: number;
  onReturnHelpersToDraggees?: () => void;
}

export interface DragInterface extends BaseDragInterface {
  targetItemWidth: number | null;
  targetItemHeight: number | null;
  targetItemPositionInDraggee: number | null;
  $draggee: JQueryElement | null;
  otherItems: HTMLElement[] | null;
  totalOtherItems: number | null;
  helpers: JQueryElement[] | null;
  helperTargets: {left: number; top: number}[] | null;
  helperPositions: {left: number; top: number}[] | null;
  helperLagIncrement: number | null;
  updateHelperPosProxy: (() => void) | null;
  updateHelperPosFrame: number | null;
  lastMouseX: number | null;
  lastMouseY: number | null;
  draggeeDisplay?: string;
  draggeeVirtualMidpointX?: number;
  draggeeVirtualMidpointY?: number;

  init(items?: ElementOrJQuery, settings?: DragSettings): void;
  allowDragging(): boolean;
  startDragging(): void;
  setDraggee($draggee: JQueryElement): void;
  appendDraggee($newDraggee: JQueryElement): void;
  drag(didMouseMove: boolean): void;
  stopDragging(): void;
  findDraggee(): JQueryElement;
  getHelperTargetX(real?: boolean): number;
  getHelperTargetY(real?: boolean): number;
  returnHelpersToDraggees(): void;
  onReturnHelpersToDraggees(): void;
}

// ContextMenu interfaces and types
export interface ContextMenuOption {
  label: string;
  onClick?: (event: JQuery.TriggeredEvent) => void;
}

export type ContextMenuOptions = {
  [key: string]: ContextMenuOption | '-';
};

export interface ContextMenuSettings {
  menuClass?: string;
}

export interface ContextMenuInterface {
  $target: JQueryElement;
  options: ContextMenuOptions;
  $menu: JQueryElement | null;
  showingMenu: boolean;
  showing?: boolean;
  currentTarget?: HTMLElement;
  settings: ContextMenuSettings;

  init(
    target: ElementOrJQuery,
    options: ContextMenuOptions,
    settings?: ContextMenuSettings
  ): void;
  buildMenu(): void;
  showMenu(ev: JQuery.TriggeredEvent): void;
  hideMenu(): void;
  enable(): void;
  disable(): void;
  destroy(): void;
}

// CustomSelect interfaces and types
export interface CustomSelectSettings {
  anchor?: ElementOrJQuery | null;
  attachToElement?: ElementOrJQuery | null; // Deprecated
  windowSpacing?: number;
  onOptionSelect?: () => void;
}

export interface CustomSelectInterface {
  settings: CustomSelectSettings;
  visible: boolean;
  $container: JQueryElement;
  $options: JQueryElement;
  $ariaOptions: JQueryElement;
  $anchor: JQueryElement | null;
  menuId: string;
  _windowWidth: number | null;
  _windowHeight: number | null;
  _windowScrollLeft: number | null;
  _windowScrollTop: number | null;
  _anchorOffset: any | null;
  _anchorWidth: number | null;
  _anchorHeight: number | null;
  _anchorOffsetRight: number | null;
  _anchorOffsetBottom: number | null;
  _menuWidth: number | null;
  _menuHeight: number | null;

  init(container: ElementOrJQuery, settings?: CustomSelectSettings): void;
  addOptions($options: JQueryElement): void;
  show(): void;
  hide(): void;
  selectOption($option: JQueryElement): void;
  updateMenuPosition(): void;
  destroy(): void;
}

// Select interfaces and types
export interface SelectSettings {
  multi?: boolean;
  allowEmpty?: boolean;
  checkboxMode?: boolean;
  vertical?: boolean;
  horizontal?: boolean;
  handle?: string | ElementOrJQuery;
  filter?: string | (() => boolean);
  collapsible?: boolean;
  removeFocusOnMouseOut?: boolean;
  makeFocusable?: boolean;
  waitForDoubleClicks?: boolean;
  onSelectionChange?: () => void;
}

export interface SelectInterface {
  $container: JQueryElement;
  $items: JQueryElement;
  $selectedItems: JQueryElement;
  $focusedItem: JQueryElement | null;
  mousedownTarget: HTMLElement | null;
  mouseUpTimeout: number | null;
  callbackFrame: number | null;
  $focusable: JQueryElement | null;
  $first: JQueryElement | null;
  first: number | null;
  $last: JQueryElement | null;
  last: number | null;
  settings: SelectSettings;

  init(
    container?: ElementOrJQuery,
    items?: ElementOrJQuery,
    settings?: SelectSettings
  ): void;
  getItemIndex($item: JQueryElement): number;
  isSelected(item: ElementOrJQuery): boolean;
  selectItem(
    $item: JQueryElement,
    focus?: boolean,
    preventScroll?: boolean
  ): void;
  selectAll(): void;
  selectRange($item: JQueryElement, preventScroll?: boolean): void;
  deselectItem($item: JQueryElement): void;
  deselectAll(clearFirst?: boolean): void;
  deselectOthers($item: JQueryElement): void;
  toggleItem($item: JQueryElement, preventScroll?: boolean): void;
  addItems(items: ElementOrJQuery): void;
  removeItems(items: ElementOrJQuery): void;
  removeAllItems(): void;
  getTotalSelected(): number;
  getSelectedItems(): JQueryElement;
  getFocusedItem(): JQueryElement | null;
  focusItem($item: JQueryElement, preventScroll?: boolean): void;
  focusNextItem(): void;
  focusPreviousItem(): void;
  destroy(): void;
}

// SelectMenu interfaces and types
export interface SelectMenuSettings extends CustomSelectSettings {
  ulClass?: string;
}

export interface SelectMenuInterface {
  selected: number;
  settings: SelectMenuSettings;
  dom: {
    $btnLabel: JQueryElement;
    ul?: HTMLElement;
    options?: HTMLElement[];
  };

  init(
    btn: ElementOrJQuery,
    options: any[],
    settings?: SelectMenuSettings,
    callback?: () => void
  ): void;
  build(): void;
  select(option: number): void;
  setBtnText(text: string): void;
}

// MenuBtn interfaces and types
export interface MenuBtnSettings {
  menuAnchor?: ElementOrJQuery | null;
  onOptionSelect?: (option: any) => void;
}

export interface MenuBtnInterface {
  $btn: JQueryElement;
  menu: any;
  showingMenu: boolean;
  disabled: boolean;
  observer: MutationObserver | null;
  searchStr: string;
  clearSearchStrTimeout: number | null;
  settings: MenuBtnSettings;

  init(btn: ElementOrJQuery, menu?: any, settings?: MenuBtnSettings): void;
  onBlur(): void;
  onKeyDown(ev: JQuery.KeyDownEvent): void;
  clearSearchStr(): void;
  focusOption($option: JQueryElement): void;
  focusSelectedOption(): void;
  focusFirstOption(): void;
  focusLastOption(): void;
  moveFocusUp(dist?: number): void;
  moveFocusDown(dist?: number): void;
  onMouseDown(ev: JQuery.MouseDownEvent): void;
  showMenu(): void;
  hideMenu(): void;
  onMenuHide(): void;
  onOptionSelect(option: any): void;
  enable(): void;
  disable(): void;
  handleStatusChange(): void;
  destroy(): void;
}

// Modal interfaces and types
export interface ModalSettings {
  autoShow?: boolean;
  draggable?: boolean;
  dragHandleSelector?: string | null;
  resizable?: boolean;
  minGutter?: number;
  onShow?: () => void;
  onHide?: () => void;
  onFadeIn?: () => void;
  onFadeOut?: () => void;
  closeOtherModals?: boolean;
  hideOnEsc?: boolean;
  hideOnShadeClick?: boolean;
  triggerElement?: ElementOrJQuery | null;
  shadeClass?: string;
}

export interface ModalInterface {
  $container: JQueryElement | null;
  $shade: JQueryElement | null;
  $triggerElement: JQueryElement | null;
  $liveRegion: JQueryElement;
  visible: boolean;
  dragger: any | null;
  desiredWidth: number | null;
  desiredHeight: number | null;
  resizeDragger: any | null;
  resizeStartWidth: number | null;
  resizeStartHeight: number | null;
  settings: ModalSettings;

  init(container?: ElementOrJQuery, settings?: ModalSettings): void;
  addLiveRegion(): void;
  setContainer(container: ElementOrJQuery): void;
  show(): void;
  hide(): void;
  updateSizeAndPosition(): void;
  updateBodyHeight(): void;
  getWidth(): number;
  getHeight(): number;
  destroy(): void;
}

// HUD interfaces and types
export interface HUDSettings {
  shadeClass?: string;
  hudClass?: string;
  tipClass?: string;
  bodyClass?: string;
  headerClass?: string;
  footerClass?: string;
  mainContainerClass?: string;
  mainClass?: string;
  orientations?: string[];
  triggerSpacing?: number;
  windowSpacing?: number;
  tipWidth?: number;
  minBodyWidth?: number;
  minBodyHeight?: number;
  withShade?: boolean;
  onShow?: () => void;
  onHide?: () => void;
  onSubmit?: () => void;
  closeBtn?: JQueryElement | null;
  listenToMainResize?: boolean;
  showOnInit?: boolean;
  closeOtherHUDs?: boolean;
  hideOnEsc?: boolean;
  hideOnShadeClick?: boolean;
}

export interface HUDInterface {
  $trigger: JQueryElement | null;
  $fixedTriggerParent: JQueryElement | null;
  $hud: JQueryElement | null;
  $tip: JQueryElement | null;
  $body: JQueryElement | null;
  $header: JQueryElement | null;
  $footer: JQueryElement | null;
  $mainContainer: JQueryElement | null;
  $main: JQueryElement | null;
  $shade: JQueryElement | null;
  $nextFocusableElement: JQueryElement | null;
  showing: boolean;
  orientation: string | null;
  updatingSizeAndPosition: boolean;
  windowWidth: number | null;
  windowHeight: number | null;
  scrollTop: number | null;
  scrollLeft: number | null;
  mainWidth: number | null;
  mainHeight: number | null;
  spWidth?: number | null;
  spHeight?: number | null;
  spScrollTop?: number | null;
  spScrollLeft?: number | null;
  tipClass?: string;

  init(
    trigger: ElementOrJQuery,
    bodyContents?: string | ElementOrJQuery | Record<string, any>,
    settings?: HUDSettings
  ): void;
  updateBody(bodyContents: string | ElementOrJQuery): void;
  show(ev?: Event): void;
  showContainer(): void;
  onShow(): void;
  updateRecords(): boolean;
  updateSizeAndPosition(force?: boolean): void;
  updateSizeAndPositionInternal(): void;
  hide(): void;
  hideContainer(): void;
  onHide(): void;
  toggle(): void;
  submit(): void;
  onSubmit(): void;
  destroy(): void;
}

// UiLayer interfaces and types
export interface UiLayerOptions {
  bubble?: boolean;
}

export interface UiLayerShortcut {
  key: string;
  shortcut: {
    keyCode: number;
    ctrl: boolean;
    shift: boolean;
    alt: boolean;
  };
  callback: (event: JQuery.KeyDownEvent) => void;
}

export interface UiLayer {
  $container: JQueryElement | null;
  shortcuts: UiLayerShortcut[];
  isModal?: boolean;
  options: UiLayerOptions;
}

export interface UiLayerManagerInterface {
  layers: UiLayer[];
  layer: number;
  currentLayer: UiLayer;
  modalLayers: UiLayer[];
  highestModalLayer: UiLayer | undefined;

  init(): void;
  addLayer(
    container?: ElementOrJQuery | UiLayerOptions,
    options?: UiLayerOptions
  ): this;
  removeLayer(layer?: ElementOrJQuery): this;
  getLayerIndex(layer: ElementOrJQuery): number | undefined;
  removeLayerAtIndex(index: number): this;
  registerShortcut(
    shortcut:
      | number
      | {keyCode: number; ctrl?: boolean; shift?: boolean; alt?: boolean},
    callback: (event: JQuery.KeyDownEvent) => void,
    layer?: number
  ): this;
  unregisterShortcut(
    shortcut:
      | number
      | {keyCode: number; ctrl?: boolean; shift?: boolean; alt?: boolean},
    layer?: number
  ): this;
  triggerShortcut(ev: JQuery.KeyDownEvent, layerIndex?: number): void;
}

// DragSort interfaces and types
export interface DragSortSettings extends DragSettings {
  container?: ElementOrJQuery | null;
  insertion?: string | ((draggee: JQueryElement) => JQueryElement) | null;
  moveTargetItemToFront?: boolean;
  magnetStrength?: number;
  onInsertionPointChange?: () => void;
  onSortChange?: () => void;
}

export interface DragSortInterface extends DragInterface {
  $heightedContainer: JQueryElement | null;
  $insertion: JQueryElement | null;
  insertionVisible: boolean;
  oldDraggeeIndexes: number[] | null;
  newDraggeeIndexes: number[] | null;
  closestItem: HTMLElement | null;

  init(items?: ElementOrJQuery, settings?: DragSortSettings): void;
  createInsertion(): JQueryElement | undefined;
  getHelperTargetX(): number;
  getHelperTargetY(): number;
  canInsertBefore($item: JQueryElement): boolean;
  canInsertAfter($item: JQueryElement): boolean;
  onDragStart(): void;
  onDrag(): void;
  onDragStop(): void;
  onInsertionPointChange(): void;
  onSortChange(): void;
}

// DisclosureMenu types
export interface DisclosureMenuSettings {
  position?: 'above' | 'below' | null;
  windowSpacing?: number;
  withSearchInput?: boolean;
}

export interface DisclosureMenuItem {
  id?: string;
  type?: 'button' | 'link';
  url?: string;
  label?: string;
  html?: string;
  description?: string;
  icon?: string | Element | (() => Promise<Element>);
  iconColor?: string;
  selected?: boolean;
  destructive?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  action?: string;
  params?: string | object;
  confirm?: string;
  redirect?: string;
  status?: string;
  attributes?: {[key: string]: string};
  onActivate?: () => void;
  callback?: () => void;
}

export interface DisclosureMenuInterface {
  settings: DisclosureMenuSettings | null;
  $trigger: JQueryElement;
  $container: JQueryElement;
  $alignmentElement: JQueryElement;
  $nextFocusableElement: JQueryElement | null;
  $searchInput: JQueryElement | null;

  searchStr: string;
  clearSearchStrTimeout: number | null;

  addSearchInput(): void;
  addDisclosureMenuEventListeners(): void;
  focusElement(component: 'prev' | 'next' | HTMLElement | JQueryElement): void;
  handleMousedown(event: Event): void;
  handleKeypress(ev: KeyboardEvent): void;
  isExpanded(): boolean;
  handleTriggerClick(): void;
  show(): void;
  hide(): void;
  focusIsInMenu(): boolean;
  setContainerPosition(): void;
  clearSearchStr(): void;
  isPadded(tag?: string): boolean;
  createItem(
    item: DisclosureMenuItem | HTMLElement | JQueryElement
  ): HTMLElement;
  addItem(
    item: DisclosureMenuItem,
    ul?: HTMLElement,
    prepend?: boolean
  ): HTMLElement;
  addItems(items: DisclosureMenuItem[], ul?: HTMLElement): void;
  addHr(before?: HTMLElement): HTMLElement;
  getFirstDestructiveGroup(): HTMLElement | null;
  addGroup(
    heading?: string | null,
    addHrs?: boolean,
    before?: HTMLElement | null
  ): HTMLElement;
  toggleItem(el: HTMLElement, show?: boolean): void;
  showItem(el: HTMLElement): void;
  hideItem(el: HTMLElement): void;
  removeItem(el: HTMLElement): void;
  updateHrVisibility(): void;
  destroy(): void;
}

// MultiFunctionBtn types
export interface MultiFunctionBtnSettings {
  busyClass?: string;
  clearLiveRegionTimeout?: number;
  failureMessageDuration?: number;
  changeButtonText?: boolean;
}

export interface MultiFunctionBtnInterface {
  $btn: JQueryElement;
  $btnLabel: JQueryElement;
  $liveRegion: JQueryElement;

  defaultMessage: string | null;
  busyMessage: string | null;
  failureMessage: string | null;
  retryMessage: string | null;
  successMessage: string | null;

  busyEvent(): void;
  failureEvent(): void;
  successEvent(): void;
  updateMessages(message: string): void;
  endBusyState(): void;
  destroy(): void;
}

// MixedInput types
export interface MixedInputSettings {
  // Add specific settings if needed in the future
}

export interface MixedInputInterface {
  $container: JQueryElement;
  elements: JQueryElement[];
  focussedElement: JQueryElement | null;
  blurTimeout: number | null;

  getElementIndex($elem: JQueryElement): number;
  isText($elem: JQueryElement): boolean;
  onFocus(): void;
  addTextElement(index?: number, focus?: boolean): TextElementInterface;
  addElement($elem: JQueryElement, index?: number, focus?: boolean): void;
  removeElement($elem: JQueryElement): void;
  setFocus($elem: JQueryElement): void;
  blurFocussedElement(): void;
  focusPreviousElement($from: JQueryElement): void;
  focusNextElement($from: JQueryElement): void;
  focusStart(): void;
  focusEnd(): void;
  setCarotPos($elem: JQueryElement, pos: number): void; // deprecated
  setCaretPos($elem: JQueryElement, pos: number): void;
}

export interface TextElementInterface {
  parentInput: MixedInputInterface;
  $input: JQueryElement;
  $stage: JQueryElement | null;
  val: string | null;
  focussed: boolean;
  interval: number | null;
  stageWidth?: number;

  getIndex(): number;
  buildStage(): void;
  getTextWidth(val?: string): number;
  onFocus(): void;
  onBlur(): void;
  onKeyDown(ev: JQuery.KeyDownEvent): void;
  getVal(): string;
  setVal(val: string): void;
  checkInput(): boolean;
  setWidth(force?: boolean): void;
  onChange(): void;
}

// NiceText types
export interface NiceTextSettings {
  autoHeight?: boolean;
  showCharsLeft?: boolean;
  charsLeftClass?: string;
  negativeCharsLeftClass?: string;
  hint?: string;
  onHeightChange?: () => void;
}

export interface NiceTextInterface {
  $input: JQueryElement;
  $hint: JQueryElement | null;
  $hintContainer?: JQueryElement;
  $stage: JQueryElement | null;
  $charsLeft: JQueryElement | null;
  autoHeight: boolean | null;
  maxLength: number | null;
  showCharsLeft: boolean;
  showingHint: boolean;
  val: string | null;
  inputBoxSizing: string;
  width: number | null;
  height: number | null;
  minHeight: number | null;
  initialized: boolean;

  isVisible(): boolean;
  initialize(): void;
  initializeIfVisible(): void;
  getVal(): string;
  showHint(): void;
  hideHint(): void;
  onTextChange(): void;
  onKeyDown(ev: JQuery.KeyDownEvent): void;
  buildStage(): void;
  getHeightForValue(val: string): number;
  updateHeight(): void;
  updateHeightIfWidthChanged(): void;
  onHeightChange(): void;
  updateCharsLeft(): void;
  destroy(): void;
}

// DragDrop types
export interface DragDropSettings extends DragSettings {
  dropTargets?:
    | string
    | HTMLElement[]
    | JQueryElement
    | (() => HTMLElement[] | JQueryElement);
  onDropTargetChange?: (activeDropTarget: JQueryElement | null) => void;
  activeDropTargetClass?: string;
}

export interface DragDropInterface extends DragInterface {
  $dropTargets: JQueryElement | null;
  $activeDropTarget: JQueryElement | null;

  updateDropTargets(): void;
  onDragStart(): void;
  onDrag(): void;
  onDragStop(): void;
  fadeOutHelpers(): void;
}
