import { hookBeforeAttrEffect, useBeforeAttrEffect } from "better-react-helper"
import { StoreValue, StoreValueCreater, hookCreateChangeAtom, isFiber } from "better-react"
import { EmptyFun, StoreRef, alawaysFalse, emptyArray, storeRef } from "wy-helper"

export function genTemplateString(ts: TemplateStringsArray, vs: (string | number)[]) {
  const xs: any[] = []
  for (let i = 0; i < vs.length; i++) {
    xs.push(ts[i])
    xs.push(vs[i])
  }
  xs.push(ts[vs.length])
  return xs.join('')
}

function addChild(row: any, newChildren: any[]) {
  if (isFiber(row)) {
    const value = row.lazyGetResultValue()
    addChild(value, newChildren)
  } else if (Array.isArray(row)) {
    addChildren(row, newChildren)
  } else if (row instanceof Node) {
    newChildren.push(row)
  } else {
    console.error("不知道是什么类型,无法加入", row)
  }
}
function addChildren(list: readonly any[], newChildren: any[]) {
  for (let i = 0; i < list.length; i++) {
    const row = list[i]
    addChild(row, newChildren)
  }
}



class StoreValueNode implements StoreValue {
  constructor(
    private pNode: Node,
    private cache: StoreRef<readonly Node[]>
  ) { }
  private list: any[] = []
  hookAddResult(...vs: readonly any[]): void {
    for (const v of vs) {
      this.list.push(v)
    }
  }

  private childrenDirty = hookCreateChangeAtom()(true, alawaysFalse)

  onRenderLeave(addLevelEffect: (level: number, set: EmptyFun) => void, parentResult: any) {
    if (this.childrenDirty.get()) {
      const that = this
      addLevelEffect(-1, () => {
        const lastChildren = that.cache.get()
        const pNode = that.pNode
        const newChildren: Node[] = []
        addChildren(that.list, newChildren)
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
        that.cache.set(newChildren)
      })
    }
    return emptyArray
  }
}
export function createStoreValueCreater(pNode: Node): StoreValueCreater {
  const cache = storeRef(emptyArray)
  return function () {
    return new StoreValueNode(pNode, cache)
  }
}


