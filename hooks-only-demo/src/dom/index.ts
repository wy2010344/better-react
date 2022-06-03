import { Fiber, useFiber } from "../core";
import { DomElements, SvgElements } from "./html";
import { FiberNode, FiberText } from "./updateDom";

export function useContent(content: string) {
  useFiber(function (fiber) {
    if (!fiber.dom) {
      fiber.dom = FiberText.create()
    }
  }, content)
}

const domMap = new Map<string, (fiber: Fiber<DomElements[keyof DomElements]>) => void>()
function createOrGetDomFun<T extends keyof DomElements>(type: T) {
  type = type.toLowerCase() as T
  let old = domMap.get(type)
  if (!old) {
    old = function (fiber) {
      if (!fiber.dom) {
        fiber.dom = FiberNode.createDom(type)
      }
      const dom = fiber.dom as FiberNode
      dom.reconcile()
      fiber.props?.children?.()
    }
    domMap.set(type, old)
  }
  return old
}

export function useDom<T extends keyof DomElements>(type: T, props: DomElements[T]) {
  useFiber(createOrGetDomFun(type), props)
}

const svgMap = new Map<string, (fiber: Fiber<SvgElements[keyof SvgElements]>) => void>()
function createOrGetSvgFun<T extends keyof SvgElements>(type: T) {
  type = type.toLowerCase() as T
  let old = svgMap.get(type)
  if (!old) {
    old = function (fiber) {
      if (!fiber.dom) {
        fiber.dom = FiberNode.createSvg(type)
      }
      const dom = fiber.dom as FiberNode
      dom.reconcile()
      fiber.props?.children?.()
    }
    svgMap.set(type, old)
  }
  return old
}
export function useSvg<T extends keyof SvgElements>(type: T, props: SvgElements[T]) {
  useFiber(createOrGetSvgFun(type), props)
}
