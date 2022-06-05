import { WithDraftFiber, useFiber, findParentAndBefore } from "better-react";
import { DomElements, SvgElements } from "./html";
import { FiberNode, FiberText } from "./updateDom";
export { scheduleAskTime } from './schedule'
export { StyleNode, isSVG, FiberNode, FiberText, StyleContext } from './updateDom'
export { React, DomElements, SvgElements } from './html'
export function useContent(content: string) {
  useFiber(function (fiber) {
    if (!fiber.dom) {
      fiber.dom = FiberText.create()
    }
    findParentAndBefore(fiber.dom, fiber)
  }, content)
}

const domMap = new Map<string, (fiber: WithDraftFiber<DomElements[keyof DomElements]>) => void>()
function createOrGetDomFun<T extends keyof DomElements>(type: T) {
  type = type.toLowerCase() as T
  let old = domMap.get(type)
  if (!old) {
    const createDom = FiberNode.createDom(type)
    old = function (fiber) {
      if (!fiber.dom) {
        fiber.dom = createDom()
      }
      const dom = fiber.dom as FiberNode
      findParentAndBefore(dom, fiber)
      dom.reconcile()
      fiber.draft.props?.children?.()
    }
    domMap.set(type, old)
  }
  return old
}

const EMPTYPROPS = {}
export function useDom<T extends keyof DomElements>(type: T, props?: DomElements[T]) {
  useFiber(createOrGetDomFun(type), props || EMPTYPROPS)
}

const svgMap = new Map<string, (fiber: WithDraftFiber<SvgElements[keyof SvgElements]>) => void>()
function createOrGetSvgFun<T extends keyof SvgElements>(type: T) {
  type = type.toLowerCase() as T
  let old = svgMap.get(type)
  if (!old) {
    const createSvg = FiberNode.createSvg(type)
    old = function (fiber) {
      if (!fiber.dom) {
        fiber.dom = createSvg()
      }
      const dom = fiber.dom as FiberNode
      findParentAndBefore(dom, fiber)
      dom.reconcile()
      fiber.draft.props?.children?.()
    }
    svgMap.set(type, old)
  }
  return old
}
export function useSvg<T extends keyof SvgElements>(type: T, props?: SvgElements[T]) {
  useFiber(createOrGetSvgFun(type), props || EMPTYPROPS)
}
