import { useFiber } from "../core/fc";
import { DomElements, SvgElements } from "./html";
import { FiberNode, FiberText } from "./updateDom";





export function useContent(content: string) {
  useFiber(function (fiber) {
    if (!fiber.dom) {
      fiber.dom = FiberText.create()
    }
  }, content)
}
export function useDom<T extends keyof DomElements>(type: T, props: DomElements[T]) {
  useFiber(function (fiber) {
    if (!fiber.dom) {
      fiber.dom = FiberNode.createDom(type)
    }
    const dom = fiber.dom as FiberNode
    dom.reconcile()
    fiber.props?.children?.()
  }, props)
}

export function useSvg<T extends keyof SvgElements>(type: T, props: SvgElements[T]) {
  useFiber(function (fiber) {
    if (!fiber.dom) {
      fiber.dom = FiberNode.createSvg(type)
    }
    const dom = fiber.dom as FiberNode
    dom.reconcile()
    fiber.props?.children?.()
  }, props)
}
