import { BetterNode, Props } from "./Fiber"
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
  return {
    type,
    props: {
      ...props,
      children: children.map(child =>
        typeof child === "object" ? child : createTextElement(child)
      )
    }
  };
}
function createFragment(props: Props) {
  console.log(props, "dd")
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
  export type Element = BetterNode
}