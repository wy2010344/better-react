import { FindParentAndBefore } from "./commitWork"

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



type EMPTY = {}
type BRParam<T extends EMPTY> = Omit<T, "key" | "contexts">
type BRParamAll<T extends EMPTY> = {
  key?: string | number
} & BRParam<T>
export type BRNode<T extends EMPTY = EMPTY> = {
  type: BRFun<T>
  props: BRParamAll<T>
}
export type BRFun<T extends EMPTY = EMPTY> = (params: BRParamAll<T>) => BRNode<T>
export type Fiber = BRNode<any> & {
  /**
   * @param fiber 自身，可能在函数中附加DOM节点
   * @param props 
   * @returns 返回供使用的DOM节点
   */
  render(fiber: Fiber): any[]
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

  //旧的成员
  alternate?: Fiber
  //更新方式，是在和旧hook对比得出的结论。
  //树里只有UPDATE/PLACEMENT，是需要计算子节点的
  //一计算，所有子节点，非2之一
  effectTag?: "UPDATE" | "PLACEMENT" | "DELETION" | "DIRTY"
  /**元素池*/
  pool?: Map<any, Fiber>

  /**只有dom的节点有这两个属性 */
  dom?: VirtaulDomNode
  /**只有hooks有Fiber有这两个属性 */
  hooks?: {
    value: StoreValue<any>[]
    effect: StoreRef<{
      deps?: readonly any[]
      effect(): void | (() => void)
      destroy?(): void
    }>[]
    memo: StoreRef<{
      deps: readonly any[]
      value: any
      effect(): any
    }>[]
    contextProvider: Map<any, {
      changeValue(v: any): void
    }>
    contextCosumer: {
      setFiber(v: Fiber): void
      getValue(): any
      destroy(): void
    }[]
  }
}

export function getPool(fiber: Fiber) {
  if (!fiber.pool) {
    fiber.pool = new Map()
  }
  return fiber.pool!
}

export function getFiberKey(fiber: Fiber | undefined, key: any): Fiber | void {
  if (fiber) {
    return fiber.pool?.get(key)
  }
}

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