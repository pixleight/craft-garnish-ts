import BaseDrag from './BaseDrag';
import type {BaseDragInterface} from './types';

/**
 * Drag-to-move class
 *
 * Builds on the BaseDrag class by simply moving the dragged element(s) along with the mouse.
 */
export default BaseDrag.extend<BaseDragInterface>({
  onDrag(): void {
    this.$targetItem!.css({
      left: this.mouseX! - this.mouseOffsetX!,
      top: this.mouseY! - this.mouseOffsetY!,
    });
  },
});
