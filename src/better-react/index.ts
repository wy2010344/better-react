import { BetterNode, Fiber, Props } from "./Fiber"
import { reconcile, setRootFiber } from "./reconcile"

import { useState, useStateFrom, useValue } from './fc'

function render(element: BetterNode, container: Node) {
  const rootFiber = {
    dom: container,
    props: {
      children: [element]
    },
    effectTag: "UPDATE"
  } as const
  setRootFiber(rootFiber)
  reconcile()
}

function createTextElement(text: string) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: []
    }
  }
}
function createElement(type: any, props: Props, ...children: any[]) {
  const pChildren = props?.children
  return {
    type,
    props: {
      ...props,
      children: (pChildren ? (Array.isArray(pChildren) ? pChildren : [pChildren]) : children).map(child => {
        if (typeof (child) == 'object') {
          return child
        } else {
          return createTextElement(child)
        }
      })
    }
  };
}
function createFragment(props: Props) {
  return {
    type: createElement,
    props
  }
}
export default {
  createElement,
  useState,
  useStateFrom,
  useValue,
  createFragment,
  render
}

declare namespace JSX {
  export type Element = Fiber
}