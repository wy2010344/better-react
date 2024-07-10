import { CreateChangeAtom, TempOps, TempReal, TempSubOps, hookLevelEffect } from "better-react"
import { useAttrEffect } from "better-react-helper"
import { StoreRef, alawaysFalse, emptyArray, storeRef } from "wy-helper"

export function genTemplateString(ts: TemplateStringsArray, vs: (string | number)[]) {
  const xs: any[] = []
  for (let i = 0; i < vs.length; i++) {
    xs.push(ts[i])
    xs.push(vs[i])
  }
  xs.push(ts[vs.length])
  return xs.join('')
}

export type ContentEditable = boolean | "inherit" | "plaintext-only"

export function useContentEditable(
  node: ElementContentEditable,
  contentEditable?: boolean | "inherit" | "plaintext-only",
) {
  useAttrEffect(() => {
    node.contentEditable = contentEditable + "" || "true"
  }, [node, contentEditable])
}

export function nodeAppendChild(pNode: Node, list: ListCreater, cache: StoreRef<readonly Node[]>) {
  const lastChildren = cache.get()
  const newChildren: Node[] = []
  addChildren(list, newChildren)
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
  cache.set(newChildren)
}

function addChild(row: Node | TempSubOps<ListCreater>, newChildren: Node[]) {
  if (row instanceof Node) {
    newChildren.push(row)
  } else if (row instanceof TempSubOps) {
    addChildren(row.data, newChildren)
  } else {
    console.error("不知道是什么类型,无法加入", row)
  }
}
function addChildren(list: ListCreater, newChildren: Node[]) {
  for (let i = 0; i < list.list.length; i++) {
    const row = list.list[i]
    addChild(row, newChildren)
  }
}



export function createNodeTempOps(pel: Node, createChangeAtom: CreateChangeAtom<any>) {
  const cache = storeRef(emptyArray)
  const addEffect = createChangeAtom(false, alawaysFalse)
  const root = new TempOps<ListCreater>(() => new ListCreater(), () => {
    if (!addEffect.get()) {
      addEffect.set(true)
      hookLevelEffect(-0.5, () => {
        nodeAppendChild(pel, root.data, cache)
      })
    }
  })
  return root
}

export class ListCreater implements TempReal {
  list: (Node | TempSubOps<ListCreater>)[] = []
  reset(): void {
    this.list.length = 0
  }
  add(...vs: any[]): void {
    for (let i = 0; i < vs.length; i++) {
      const v = vs[i]
      this.list.push(v)
    }
  }
}


export type TOrQuote<T extends {}> = T | ((v: T) => T | void)
export function lazyOrInit<T extends {}>(v: TOrQuote<T>) {
  if (typeof v == 'function') {
    const obj = {
      style: {}
    }
    return (v as any)(obj) || obj
  }
  return v
}