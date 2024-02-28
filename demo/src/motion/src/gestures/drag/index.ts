import { emptyFun } from "wy-helper";
import { Feature } from "../../features/Feature";
import { VisualElementDragControls } from "./VisualElementDragControls";
import { VisualElement } from "../../render/VisualElement";





export class DragGesture extends Feature<HTMLElement>{
  controls: VisualElementDragControls
  removeGroupCongrols = emptyFun
  removeListeners = emptyFun
  constructor(node: VisualElement<HTMLElement>) {
    super(node)
    this.controls = new VisualElementDragControls(node)
  }
  mount(): void {
    const { dragControls } = this.node.getProps()
    if (dragControls) {
      this.removeGroupCongrols = dragControls.subscribe(this.controls)
    }
    this.removeListeners = this.controls.addListeners() || emptyFun
  }
  unmount(): void {
    this.removeGroupCongrols()
    this.removeListeners()
  }
}