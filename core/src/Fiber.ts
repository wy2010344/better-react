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
export type FiberData = {
  /**不能有返回值,无法承接处理,因为子render后返回给父,造成父的继续render?*/
  render(deps?: readonly any[]): void
  deps?: readonly any[]
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
export function fiberDataClone(v: FiberData): FiberData {
  return {
    ...v
  }
}

type BaseFiber = {
  parent?: Fiber
  dom?: VirtaulDomNode
  contextProvider?: Map<any, {
    changeValue(v: any): void
  }>
  hookValue?: HookValue<any, any>[]
  hookEffects?: [
    ChangeAtomValue<HookEffect>[],
    ChangeAtomValue<HookEffect>[],
    ChangeAtomValue<HookEffect>[]
  ]
  hookMemo?: ChangeAtomValue<HookMemo<any>>[]
  hookContextCosumer?: HookContextCosumer<any, any>[]
}
/**
 * 并不需要新旧diff,所以不需要alter
 * 节点树是固定的,除了特殊的map/if
 * 
 * 将自身地址作为ID,这个地址下有两条记录
 */
export type PlacementFiber = {
  effectTag: "PLACEMENT"
  draft: FiberData
} & BaseFiber
export type UpdateFiber = {
  effectTag: "UPDATE"
  current: Readonly<FiberData>
  draft: FiberData
} & BaseFiber
export type ChangeOrderFiber = {
  current: Readonly<FiberData>
  draft: FiberData
} & BaseFiber
export type NotChangeFiber = {
  current: Readonly<FiberData>
} & BaseFiber
export type ChangeBodyFiber = PlacementFiber | UpdateFiber
export type WithDraftFiber = ChangeBodyFiber | ChangeOrderFiber
export type Fiber = WithDraftFiber | NotChangeFiber
export function isChangeBodyFiber(v: Fiber): v is ChangeBodyFiber {
  return (v as any).effectTag as any
}
export function isPlacementFiber(v: Fiber): v is PlacementFiber {
  return (v as any).effectTag == "PLACEMENT"
}
export function isWithDraftFiber(v: Fiber): v is WithDraftFiber {
  return (v as any).draft as any
}
export function getData(v: Fiber) {
  if (isWithDraftFiber(v)) {
    return v.draft
  } else {
    return v.current
  }
}
export function getEditData<T>(v: Fiber): FiberData {
  return (v as any).draft
}

export type VirtaulDomNode = {
  //创建
  // create(): void
  // //每次更新props
  // update(): void
  //在update之前,所以要更新props
  isPortal(): boolean
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

export function findParentAndBefore(fiber: Fiber) {
  const dom = fiber.dom
  if (dom) {
    if (dom.isPortal()) {
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
  if (fiber.dom?.isPortal()) {
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