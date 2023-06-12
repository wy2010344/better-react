import { ChangeAtomValue, createChangeAtom, FindParentAndBefore } from "./commitWork"
import { arrayNotEqualDepsWithEmpty, storeRef } from "./util"

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


type RenderDeps = {
  deps?: readonly any[],
  render(deps?: readonly any[]): void
}

type EffectTag = "PLACEMENT" | "UPDATE" | void
function whenCommitEffectTag(v: EffectTag) {
  return undefined
}
/**
 * 会调整顺序的,包括useMap的父节点与子结点.但父节点只调整child与lastChild
 * 子节点只调整prev与next
 * 但是子节点又可能是父节点,父节点也可能是子节点.
 * 如果是普通fiber节点,它的兄弟是定的,但它可能是useMap的根节点
 * 如果是useMap的子节点,它的兄弟是不定的,它的父是定的,
 * 所有的类型,父节点一定是定的,区别在于是父的什么位置
 * 只有声明的时候能确定
 * 普通Fiber的子节点可能是MapFiber,MapFiber自动将child/lastChild变成动态的.
 * 只是MapFiber的子节点都是手动创建的.但手动创建的是普通Fiber,不是MapFiber?
 * 可以是MapFiber,只要控制返回值不是render+deps,而是mapFiber的构造参数
 * 如果是oneFiber,父节点的child与lastChild会变化,但子结点的before与next都是空
 */
export class Fiber {
  /**全局key,使帧复用,或keep-alive*/
  globalKey?: any
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
  hookMemo?: {
    get(): any,
    value: ChangeAtomValue<HookMemo<any>>
  }[]
  hookContextCosumer?: HookContextCosumer<any, any>[]

  /**初始化或更新 
   * UPDATE可能是setState造成的,可能是更新造成的
   * 这其中要回滚
   * 当提交生效的时候,自己的值变空.回滚的时候,也变成空
  */
  effectTag = createChangeAtom<EffectTag>("PLACEMENT", whenCommitEffectTag)
  /**顺序*/
  firstChild: StoreRef<Fiber | void> = undefined!
  lastChild: StoreRef<Fiber | void> = undefined!
  before: StoreRef<Fiber | void> = undefined!
  next: StoreRef<Fiber | void> = undefined!

  private renderDeps: ChangeAtomValue<RenderDeps>
  private constructor(rd: RenderDeps) {
    this.renderDeps = createChangeAtom(rd)
  }
  changeRender(render: (deps?: readonly any[]) => void, deps?: readonly any[]) {
    const { deps: oldDeps } = this.renderDeps.get()
    if (arrayNotEqualDepsWithEmpty(oldDeps, deps)) {
      //能改变render,需要UPDATE
      this.renderDeps.set({
        render,
        deps
      })
      this.effectTag.set("UPDATE")
    }
  }
  render() {
    const { render, deps } = this.renderDeps.get()
    render(deps)
  }
  private static createChild(fiber: Fiber, dynamicChild?: boolean) {
    if (dynamicChild) {
      fiber.firstChild = createChangeAtom(undefined)
      fiber.lastChild = createChangeAtom(undefined)
    } else {
      fiber.firstChild = storeRef(undefined)
      fiber.lastChild = storeRef(undefined)
    }
  }
  /**
   * 创建一个固定节点,该节点是不是MapFiber不一定
   * @param rd 
   * @param dynamicChild 
   */
  static createFix(parentFiber: Fiber, rd: RenderDeps, dynamicChild?: boolean) {
    const fiber = new Fiber(rd)
    fiber.parent = parentFiber
    fiber.before = storeRef(undefined)
    fiber.next = storeRef(undefined)
    Fiber.createChild(fiber, dynamicChild)
    return fiber
  }

  /**
   * Map的子节点,子节点是不是Map不一定
   * @param parentFiber 
   * @param rd 
   * @param dynamicChild 
   */
  static createMapChild(parentFiber: Fiber, rd: RenderDeps, dynamicChild?: boolean) {
    const fiber = new Fiber(rd)
    fiber.parent = parentFiber
    fiber.before = createChangeAtom(undefined)
    fiber.next = createChangeAtom(undefined)
    Fiber.createChild(fiber, dynamicChild)
    return fiber
  }
  /**
   * One的子节点,子节点是不是Map不一定
   * @param parentFiber 
   * @param rd 
   * @param dynamicChild 
   */
  static createOneChild(parentFiber: Fiber, rd: RenderDeps, dynamicChild?: boolean) {
    const fiber = new Fiber(rd)
    fiber.parent = parentFiber
    fiber.before = emptyPlace
    fiber.next = emptyPlace
    Fiber.createChild(fiber, dynamicChild)
    return fiber
  }
}
const emptyPlace = storeRef<Fiber | void>(undefined)

export type VirtualDomOperator<T = any, M = any> = [
  (m: M) => VirtaulDomNode<T>,
  T,
  M
] | [
  (m: undefined) => VirtaulDomNode<T>,
  T,
  undefined
] | [
  () => VirtaulDomNode<T>,
  T
]

export type RenderWithDep<T extends readonly any[] = readonly any[]> = [
  (v: T) => void,
  T
] | [
  (v: undefined) => void,
  undefined
] | [
  () => void
]

export type VirtaulDomNode<T = any> = {
  useUpdate(props: T): void
  //创建
  //在update之前,所以要更新props
  // isPortal(): boolean
  // appendAsPortal(): void
  appendAfter(value: FindParentAndBefore): void
  //只对部分元素执行删除
  removeFromParent(): void
  //所有都会执行
  destroy(): void
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
