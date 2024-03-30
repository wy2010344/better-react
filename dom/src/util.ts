import { FiberConfig, MemoEvent } from "better-react"
import { useBeforeAttrEffect } from "better-react-helper"
import { emptyArray } from "wy-helper"
import { domTagNames } from "./updateDom"

export function genTemplateString(ts: TemplateStringsArray, vs: (string | number)[]) {
  const xs: any[] = []
  for (let i = 0; i < vs.length; i++) {
    xs.push(ts[i])
    xs.push(vs[i])
  }
  xs.push(ts[vs.length])
  return xs.join('')
}



export function allowAddAnyNode(v: any) {
  return v instanceof Node
}


function addChildren(list: any[], newChildren: any[]) {
  for (let i = 0; i < list.length; i++) {
    const row = list[i]
    if (typeof row == 'function') {
      addChildren(row(), newChildren)
    } else {
      newChildren.push(row)
    }
  }
}

export function createUseAfterRender(pNode: Node) {
  let lastChildren = emptyArray as Node[]
  return function (vs: any[]) {
    useBeforeAttrEffect(() => {
      const newChildren: Node[] = []
      addChildren(vs, newChildren)
      let changed = false
      let beforeNode: Node | null = null
      for (let i = 0; i < newChildren.length; i++) {
        const newChild = newChildren[i]
        if (changed) {
          if (newChild != beforeNode) {
            pNode.insertBefore(newChild, beforeNode)
          } else {
            beforeNode = beforeNode?.nextSibling
          }
        } else {
          const lastChild = lastChildren[i]
          if (newChild != lastChild) {
            changed = true
            pNode.insertBefore(newChild, lastChild)
            beforeNode = lastChild
          }
        }
      }
      for (const lastChild of lastChildren) {
        if (!newChildren.includes(lastChild)) {
          lastChild.parentNode?.removeChild(lastChild)
        }
      }
      lastChildren = newChildren
    })
    return emptyArray
  }
}


export function createParentTrigger(e: MemoEvent<Node>) {
  return {
    allowAdd: allowAddAnyNode,
    allowFiber: true,
    useAfterRender: createUseAfterRender(e.trigger)
  } as FiberConfig
}



