export type HookValueSet<T> = (v: T | ((v: T) => T), after?: () => void) => void
export type HookValue<T> = {
  value: T
  readonly set: HookValueSet<T>
}
export type HookMemo<T> = {
  deps: readonly any[]
  value: T
}
export type HookEffect = {
  deps?: readonly any[]
  destroy?: void | (() => void)
}
export type HookContextCosumer = {
  getValue(): any
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


  /*-最后遍历时生成-*/
  /**最后一个节点 */
  lastChild?: Fiber
  /**前一个节点 */
  prev?: Fiber

  hookValue?: HookValue<any>[]
  hookEffect?: HookEffect[]
  hookMemo?: HookMemo<any>[]
  hookContextCosumer?: HookContextCosumer[]
}

export function fiberDataClone<T>(v: FiberData<T>): FiberData<T> {
  return {
    ...v,
    hookValue: v.hookValue?.map(x => {
      return {
        value: x.value,
        set: x.set
      }
    }),
    hookEffect: v.hookEffect?.map(x => {
      return {
        deps: x.deps,
        destroy: x.destroy
      }
    }),
    hookMemo: v.hookMemo?.map(x => {
      return {
        value: x.value,
        deps: x.deps
      }
    }),
    hookContextCosumer: v.hookContextCosumer?.map(x => x)
  }
}
/**
 * 并不需要新旧diff,所以不需要alter
 * 节点树是固定的,除了特殊的map/if
 * 
 * 将自身地址作为ID,这个地址下有两条记录
 */
export type Fiber<T = Props> = WithDraftFiber<T> | {
  parent?: Fiber<any>
  dom?: VirtaulDomNode<T>
  contextProvider?: Map<any, {
    changeValue(v: any): void
  }>

  current: Readonly<FiberData<T>>
}
export type PlacementFiber<T> = {
  parent?: Fiber<any>
  dom?: VirtaulDomNode<T>
  contextProvider?: Map<any, {
    changeValue(v: any): void
  }>

  effectTag: "PLACEMENT"
  draft: FiberData<T>
}
export type WithDraftFiber<T = Props> = {
  parent?: Fiber<any>
  dom?: VirtaulDomNode<T>
  contextProvider?: Map<any, {
    changeValue(v: any): void
  }>

  effectTag: "UPDATE" | "DIRTY"
  current: Readonly<FiberData<T>>
  draft: FiberData<T>
} | PlacementFiber<T>
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


export type VirtaulDomNode<T = Props> = {
  //创建
  create(props: T): void
  //每次更新props
  update(props: T): void
  //只第一次更新,在create之后,即不权updateProps,还准备好了子节点
  init(): void

  isPortal(): boolean
  appendAsPortal(): void

  appendAfter(value: FindParentAndBefore): void
  removeFromParent(): void
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