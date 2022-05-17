import { useFiber } from "../core/fc";
import { FiberNode } from "./updateDom";




export function useDom(type: string, props: any) {
  useFiber(function (fiber) {
    if (!fiber.dom) {
      fiber.dom = FiberNode.createFrom(type)
    }
    const dom = fiber.dom as FiberNode
    dom.reconcile()
  }, props)
}