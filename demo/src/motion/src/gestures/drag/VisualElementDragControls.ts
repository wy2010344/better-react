import { Axis } from "wy-helper";
import { addPointerEvent } from "../../events/add-pointer-event";
import { VisualElement } from "../../render/VisualElement";
import { addDomEvent } from "../../events/add-dom-event";
import { LayoutUpdateData } from "../../projection/node/types";



export interface ResolvedConstraints {
  x: Partial<Axis>
  y: Partial<Axis>
}

export const elementDragControls = new WeakMap<
  VisualElement,
  VisualElementDragControls
>()
export class VisualElementDragControls {

  private constraints: ResolvedConstraints | false = false

  constructor(
    public readonly visualElement: VisualElement<HTMLElement>
  ) { }


  addListeners() {
    const element = this.visualElement.current
    if (!element) {
      return
    }
    elementDragControls.set(this.visualElement, this)

    const stopPointerListener = addPointerEvent(
      element,
      'pointerdown',
      event => {
        const { drag, dragListener = true } = this.getProps()
        drag && dragListener && this.start(event)
      })

    const measureDragConstraints = () => {
      //如果约束是元素,测量限制
      const { dragConstraints } = this.getProps()
      if (typeof dragConstraints == 'function') {
        this.constraints = this.resolveRefConstraints()
      }
    }

    const { projection } = this.visualElement

    const stopMeasureLayoutListener = projection.addEventListener("measure", measureDragConstraints)

    if (projection && !projection!.layout) {
      projection.root && projection.root.updateScroll()
      projection.updateLayout()
    }

    measureDragConstraints()


    const stopResizeListener = addDomEvent(window, 'resize', () => {
      this.scalePositionWithinConstraints()
    })

    const stopLayoutUpdateListener = projection.addEventListener("didUpdate", ({
      delta, hasLayoutChanged
    }: LayoutUpdateData) => {

    })
    return () => {
      stopPointerListener()
    }
  }


  getProps() {
    const props = this.visualElement.getProps()


    return {
      ...props
    }
  }

  scalePositionWithinConstraints() {

  }
}