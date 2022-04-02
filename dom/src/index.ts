import { Fiber, Props } from "better-react";
import { BRFun } from "better-react/dist/Fiber";
import { createDom, createTextNode, findFiberCreateStyle } from "./updateDom";
export { FiberNode, updatePorps, updateSVGProps, StyleNode } from './updateDom'
export { askTimeWork } from './askTimeWork'
export type { React } from '../@types/react'
export type FunctionNode<T> = {
  type(v: T): any
  props: T
}

export type BetterNode = FunctionNode<any> | {
  type: string
  props: Props
  key: any
} | string | boolean | number | undefined


function TextElement(fiber: Fiber) {
  if (!fiber.dom) {
    fiber.dom = createTextNode(fiber.props)
  }
  return []
}
const TextElementFun = createFun()
export function createTextElement(text: string) {
  return {
    type: TextElementFun,
    render: TextElement,
    props: {
      nodeValue: text,
      children: []
    }
  }
}
function RenderDomFun(fiber: Fiber) {
  const children = fiber.props?.children.length == 1
    ? fiber.props?.children[0]
    : fiber.props?.children
  return [fiber.type({
    ...fiber.props,
    children
  })]
}
export function createElement(type: any, props: Props, ...children: any[]) {
  const pChildren = props?.children
  const realProps = {
    ...props,
    children: (pChildren ? (Array.isArray(pChildren) ? pChildren : [pChildren]) : children).map(child => {
      const tp = typeof (child)
      if (tp == 'object' || tp == 'function') {
        return child
      } else {
        return createTextElement(child)
      }
    })
  }
  if (typeof (type) == 'function') {
    return {
      type,
      render: RenderDomFun,
      props: realProps
    }
  } else {
    const v = getDOM(type)
    return {
      ...v,
      props: realProps
    }
  }
}
function createFun<T extends {} = any>() {
  const FC: BRFun<T> = (props) => {
    return {
      type: FC,
      props
    }
  }
  return FC
}

function getRenderDom(type: string) {
  return function (fiber: Fiber) {
    if (!fiber.dom) {
      fiber.dom = createDom(type, fiber.props, findFiberCreateStyle(fiber))
    }
    return fiber.props!.children
  }
}
const domPool: Map<string, {
  type: BRFun<any>
  render(fiber: Fiber): any
}> = new Map()
function getDOM(t: string) {
  let v = domPool.get(t)
  if (v) {
    return v
  } else {
    v = {
      type: createFun(),
      render: getRenderDom(t)
    }
    domPool.set(t, v)
    return v
  }
}