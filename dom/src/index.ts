import { Fiber, Props } from "better-react";
import { createDom, findFiberCreateStyle } from "./updateDom";
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
    fiber.dom = createDom(fiber.type, fiber.props)
  }
  return []
}

export function createTextElement(text: string) {
  return {
    type: "TEXT_ELEMENT",
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
function RenderDom(fiber: Fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber.type, fiber.props, findFiberCreateStyle(fiber))
  }
  return fiber.props!.children
}
export function createElement(type: any, props: Props, ...children: any[]) {
  const pChildren = props?.children
  return {
    type,
    render: typeof (type) == 'function' ? RenderDomFun : RenderDom,
    key: props?.key,
    props: {
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
  };
} 