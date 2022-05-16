
export type LinkValue<T>={
  value:T
  next?:LinkValue<T>
}
export type HookValue<T>={
  setFiber(v: Fiber): void
  get(): T
  set(v: T, callback?: () => void): void
}
export type HookMemo<T>={
  deps: readonly any[]
  value: T
  effect(): T
}
/**
 * 并不需要新旧diff,所以不需要alter
 * 节点树是固定的,除了特殊的map/if
 */
export type Fiber = {
  render(v: Fiber): void
  props: Props

  alternate?: Fiber
  effectTag?: "UPDATE" | "PLACEMENT" | "DELETION" | "DIRTY"
  dom?: VirtaulDomNode

  /**第一个子节点 */
  child?: Fiber
  /**父Fiber节点 */
  parent?: Fiber
  /**弟节点 */
  sibling?: Fiber
  /*-最后遍历时生成-*/
  /**最后一个节点 */
  lastChild?: Fiber
  /**前一个节点 */
  prev?: Fiber

  hookValue?:LinkValue<HookValue<any>>

  hookEffect?:LinkValue<{
    deps?: readonly any[]
    effect(): void | (() => void)
    destroy?(): void
  }>

  hookMemo?:LinkValue<HookMemo<any>>

  contextProvider?:Map<any, {
    changeValue(v: any): void
  }>

  hookContextCosumer?:LinkValue<{
    setFiber(v: Fiber): void
    getValue(): any
    destroy(): void
  }>


  // hooks: {
  //   value: {
  //     setFiber(v: Fiber): void
  //     get(): any
  //     set(v: any, callback?: () => void): void
  //   }[]
  //   effect: StoreRef<{
  //     deps?: readonly any[]
  //     effect(): void | (() => void)
  //     destroy?(): void
  //   }>[]
  //   memo: StoreRef<{
  //     deps: readonly any[]
  //     value: any
  //     effect(): any
  //   }>[]
  //   contextProvider: Map<any, {
  //     changeValue(v: any): void
  //   }>
  //   contextCosumer: {
  //     setFiber(v: Fiber): void
  //     getValue(): any
  //     destroy(): void
  //   }[]
  // }
}




export type VirtaulDomNode = {
  //每次更新props
  update(props: Props): void
  //只第一次更新
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