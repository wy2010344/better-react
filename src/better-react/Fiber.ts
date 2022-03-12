export type Fiber = {
  type?: any
  props?: Props
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
  dom?: Node
  /**只有hooks有Fiber有这两个属性 */
  hooks?: {
    value: {
      setFiber(v: Fiber): void
      render: StoreValue<any>
    }[]
    effect: StoreValue<{
      deps: any[]
      effect(): void | (() => void)
      destroy?(): void
    }>[]
    ref: StoreValue<any>[]
    contexts?: Context<any>[]
  }
}

export function getPool(fiber: Fiber) {
  if (!fiber.pool) {
    fiber.pool = new Map()
  }
  return fiber.pool!
}

export function getFiberKey(fiber: Fiber | undefined, key: any) {
  if (fiber) {
    return fiber.pool?.get(key)
  }
}

export type StoreValue<T> = ((v: T) => void) & (() => T)
export type Props = { [key: string]: any }

export type FunctionNode<T> = {
  type(v: T): BetterNode
  props: T
}
export type BetterNode = FunctionNode<any> | {
  type: string
  props: Props
}

let contextUid = 0
export class ContextProvider<T>{
  id = contextUid++
  constructor(
    public readonly out: T
  ) { }
  provide(value: T): Context<T> {
    return new Context(value, this)
  }
}

export class Context<T>{
  constructor(
    public value: T,
    public parent: ContextProvider<T>
  ) { }
}
export function createContext<T>(init: T) {
  return new ContextProvider(init)
}