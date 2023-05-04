import { addAppendAsPortal, addAppends, ChangeAtomValue } from "./commitWork"

export type HookValueSet<F, T> = (v: F, after?: (v: T) => void) => void
export type HookValue<F, T> = {
  value: ChangeAtomValue<T>
  readonly set: HookValueSet<F, T>
}
export type HookMemo<T> = {
  deps: readonly any[]
  value: T
}
export type HookEffect = {
  deps?: readonly any[]
  destroy?: void | (() => void)
}
export type HookContextCosumer<T, M> = {
  getValue(): M
  select(v: T): M
  shouldUpdate?(a: M, b: M): boolean
  destroy(): void
}
export type FiberData<T> = {
  render(v: Fiber<T>): void
  shouldUpdate(oldP: T, newP: T): boolean
  props: T
  /**第一个子节点 */
  child?: Fiber
  /**弟节点 */
  sibling?: Fiber
  /**最后一个节点 */
  lastChild?: Fiber
  /**前一个节点 */
  prev?: Fiber
}

//一定要克隆,克隆后还要加工
export function fiberDataClone<T>(v: FiberData<T>): FiberData<T> {
  return {
    ...v
  }
}

type BaseFiber<T> = {
  parent?: Fiber
  dom?: VirtaulDomNode<T>
  contextProvider?: Map<any, {
    changeValue(v: any): void
  }>
  hookValue?: HookValue<any, any>[]
  hookEffect?: ChangeAtomValue<HookEffect>[]
  hookMemo?: ChangeAtomValue<HookMemo<any>>[]
  hookContextCosumer?: HookContextCosumer<any, any>[]
}
/**
 * 并不需要新旧diff,所以不需要alter
 * 节点树是固定的,除了特殊的map/if
 * 
 * 将自身地址作为ID,这个地址下有两条记录
 */
export type Fiber<T = any> = WithDraftFiber<T> | ({
  current: Readonly<FiberData<T>>
} & BaseFiber<T>)
export type PlacementFiber<T> = {
  effectTag: "PLACEMENT"
  draft: FiberData<T>
} & BaseFiber<T>
export type UpdateFiber<T> = {
  effectTag: "UPDATE"
  current: Readonly<FiberData<T>>
  draft: FiberData<T>
} & BaseFiber<T>
export type WithDraftFiber<T = Props> = PlacementFiber<T> | UpdateFiber<T>


export function isWithDraftFiber<V>(v: Fiber<V>): v is WithDraftFiber<V> {
  return !!(v as any).effectTag
}
export function isPlacementFiber<T>(v: Fiber<T>): v is PlacementFiber<T> {
  return (v as any).effectTag == "PLACEMENT"
}

export function getData<T>(v: Fiber<T>) {
  if (isWithDraftFiber(v)) {
    return v.draft
  } else {
    return v.current
  }
}
export function getEditData<T>(v: Fiber<T>): FiberData<T> {
  return (v as any).draft
}

export type VirtaulDomNode<T = Props> = {
  //创建
  create(props: T): void
  //每次更新props
  update(props: T): void
  //只第一次更新,在create之后,即不权updateProps,还准备好了子节点
  init(): void
  //在update之前,所以要更新props
  isPortal(props: T): boolean

  appendAsPortal(): void
  appendAfter(value: FindParentAndBefore): void
  //只对部分元素执行删除
  removeFromParent(): void
  //所有都会执行
  destroy(): void
}
export type FindParentAndBefore = [VirtaulDomNode, VirtaulDomNode | null] | [VirtaulDomNode | null, VirtaulDomNode] | null
export type StoreRef<T> = {
  get(): T
  set(v: T): void
}
export type StoreValue<T> = {
  setFiber(v: Fiber): void
  get(): T
  set(v: T, callback?: () => void): void
}
export type Props = { [key: string]: any }

export function findParentAndBefore<T>(fiber: Fiber<T>) {
  const dom = fiber.dom
  if (dom) {
    if (dom.isPortal(getData(fiber).props)) {
      addAppendAsPortal(dom)
    } else {
      const prevData = getData(fiber).prev
      const parentBefore = prevData
        ? getCurrentBefore(prevData)
        : findParentBefore(fiber)
      if (parentBefore) {
        addAppends(dom, parentBefore)
      } else {
        console.error("未找到", fiber.dom)
      }
    }
  }
}

function getCurrentBefore(fiber: Fiber): FindParentAndBefore {
  if (fiber.dom?.isPortal(getData(fiber).props)) {
    const prev = getData(fiber).prev
    if (prev) {
      return getCurrentBefore(prev)
    } else {
      return findParentBefore(fiber)
    }
  }
  if (fiber.dom) {
    //portal节点不能作为邻节点
    return [getParentDomFilber(fiber).dom!, fiber.dom]
  }
  const lastChild = getData(fiber).lastChild
  if (lastChild) {
    //在子节点中寻找
    const dom = getCurrentBefore(lastChild)
    if (dom) {
      return dom
    }
  }
  const prev = getData(fiber).prev
  if (prev) {
    //在兄节点中找
    const dom = getCurrentBefore(prev)
    if (dom) {
      return dom
    }
  }
  return findParentBefore(fiber)
}


function findParentBefore(fiber: Fiber): FindParentAndBefore {
  const parent = fiber.parent
  if (parent) {
    if (parent.dom) {
      //找到父节点，且父节点是有dom的
      return [parent.dom, null]
    }
    const prev = getData(parent).prev
    if (prev) {
      //在父的兄节点中寻找
      const dom = getCurrentBefore(prev)
      if (dom) {
        return dom
      }
    }
    return findParentBefore(parent)
  }
  return null
}

function getParentDomFilber(fiber: Fiber) {
  let domParentFiber = fiber.parent
  while (!domParentFiber?.dom) {
    domParentFiber = domParentFiber?.parent
  }
  return domParentFiber
}