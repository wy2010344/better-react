import { MotionProps } from "../types"






/**
 * 围绕UI元素的命令式抽象
 * 包括HTMLElement,SVGElement,Three.Object3D
 */
export abstract class VisualElement<
  Instance = unknown,
  RenderState = unknown,
  Options extends {} = {}
>{

  current: Instance | null = null
  props!: MotionProps

  getProps() {
    return this.props
  }

  projection?: IProjectionNode
}