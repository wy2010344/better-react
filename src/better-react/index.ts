import { BetterNode, Fiber, Props } from "./Fiber"
import { reconcile, setRootFiber } from "./reconcile"

import { useState, useStateFrom, useValue } from './fc'

function render(element: BetterNode, container: Node) {
  const rootFiber = {
    dom: {
      node: container
    },
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
function createFragment(props: Props) {
  return {
    type: createElement,
    props,
    key: props?.key
  }
}

export const Fragment = createFragment


/**
 * 类似fragment
 * 但不会添加到父节点
 * 子节点会添加到其上
 * 自己被删除时是子节点删除，或者说，销毁事件里有清空子节点——都不太科学。。。像正常的销毁，不会移除
 * @param content
 * @param node 
 * @returns 
 */
export function createPortal(content: BetterNode, node: Node,): BetterNode {
  return {
    type: createPortal as any,
    props: {
      node,
      content
    }
  }
}
export default {
  createElement,
  useState,
  useStateFrom,
  useValue,
  createFragment,
  createPortal,
  render
}

declare namespace JSX {
  export type Element = Fiber
}