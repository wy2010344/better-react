




export class FiberId {
  private constructor(
    public readonly id: number
  ) { }
  static id = 0
  static create() {
    return new FiberId(FiberId.id)
  }
  equal(b: any) {
    return b == this
  }
}

let allFibers: ReadOnlyFiber<any>[] = []
export function insertFiber(v: ReadOnlyFiber<any>) {
  allFibers.push(v)
}
export function selectFiber(fun: (v: ReadOnlyFiber<any>) => boolean) {
  return allFibers.filter(fun)
}
export function selectOneFiber(fun: (v: ReadOnlyFiber<any>) => boolean) {
  return allFibers.find(fun)
}
export function removeFiber(fun: (v: ReadOnlyFiber<any>) => boolean) {
  allFibers = allFibers.filter(v => !fun(v))
}
export type Fiber<T> = {
  id: FiberId
  render(v: Fiber<T>): void
  props: T
  shouldUpdate(oldP: T, newP: T): boolean

  //父节点
  parent?: FiberId
  //前一个节点
  before?: FiberId
  /**是否已经生效 */
  effectTag?: "UPDATE" | "PLACEMENT" | "DELETION" | "DIRTY"
}
type ReadOnlyFiber<T> = Readonly<Fiber<T>>