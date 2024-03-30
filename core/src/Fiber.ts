import { EnvModel, FindParentAndBefore } from "./commitWork"
import { emptyArray, EmptyFun, objectFreeze, storeRef, StoreRef, ValueCenter } from "wy-helper"

export type HookMemo<T, D> = {
  deps: D
  value: T
}
export type HookEffect<D> = {
  shouldChange(a: D, b: D): any
  deps: D
  isInit: boolean
  destroy?: void | ((newDeps: EffectDestroyEvent<D>) => void)
}
export type EffectDestroyEvent<T> = {
  trigger: T
  beforeIsInit: boolean,
  beforeTrigger: T
  setRealTime(): void
}
type RenderDeps<D> = {
  isNew: boolean
  deps: D,
  oldDeps?: D,
  render(e: MemoEvent<D>): void
}

type EffectTag = "PLACEMENT" | "UPDATE" | void
function whenCommitEffectTag(v: EffectTag) {
  return undefined
}

export type FiberConfig = {
  //是否允许子fiber
  allowFiber?: boolean
  allowAdd?(v: any): any
  useAfterRender?(vs: readonly any[]): readonly any[]
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
export class Fiber<D = any, M = any> {
  /**是否已经销毁 */
  destroyed?: boolean
  /**全局key,使帧复用,或keep-alive*/
  // globalKey?: any
  contextProvider?: Map<any, ValueCenter<any>>
  hookEffects?: Map<number, StoreRef<HookEffect<any>>[]>
  hookMemo?: {
    shouldChange(a: any, b: any): any
    value: StoreRef<HookMemo<any, any>>
  }[]
  /**
   * render计算结果的汇总
   */
  readonly resultArray = this.envModel.createChangeAtom<M[]>(emptyArray as any)
  lazyGetResultArray() {
    return this.resultArray.get()
  }
  /**初始化或更新 
   * UPDATE可能是setState造成的,可能是更新造成的
   * 这其中要回滚
   * 当提交生效的时候,自己的值变空.回滚的时候,也变成空
  */
  readonly effectTag: StoreRef<EffectTag>
  /**顺序*/
  readonly firstChild: StoreRef<Fiber | void> = undefined!
  readonly lastChild: StoreRef<Fiber | void> = undefined!

  private renderDeps: StoreRef<RenderDeps<any>>

  requestReconcile: ((fun: () => any) => void) | void = undefined
  makeDirtyAndRequestUpdate: EmptyFun | void = undefined
  private constructor(
    public readonly envModel: EnvModel,
    public readonly parent: Fiber | undefined,
    public readonly before: StoreRef<Fiber | void>,
    public readonly next: StoreRef<Fiber | void>,
    public readonly config: FiberConfig,
    public readonly shouldChange: (a: D, b: D) => any,
    rd: RenderDeps<any>,
    dynamicChild?: boolean
  ) {
    this.config = objectFreeze(this.config)
    this.lazyGetResultArray = this.lazyGetResultArray.bind(this)
    this.effectTag = envModel.createChangeAtom<EffectTag>("PLACEMENT", whenCommitEffectTag)
    this.renderDeps = envModel.createChangeAtom(rd)
    if (dynamicChild) {
      this.firstChild = envModel.createChangeAtom(undefined)
      this.lastChild = envModel.createChangeAtom(undefined)
    } else {
      this.firstChild = storeRef(undefined)
      this.lastChild = storeRef(undefined)
    }
  }
  changeRender(render: (e: MemoEvent<D>) => void, deps: D) {
    const { deps: oldDeps } = this.renderDeps.get()
    if (this.shouldChange(oldDeps, deps)) {
      //能改变render,需要UPDATE
      this.renderDeps.set({
        render,
        deps,
        oldDeps,
        isNew: false
      })
      this.effectTag.set("UPDATE")
    }
  }
  render() {
    const { render, deps, oldDeps, isNew } = this.renderDeps.get()
    render({
      trigger: deps,
      beforeTrigger: oldDeps,
      isInit: isNew
    })
    if (this.config.useAfterRender) {
      const vs = objectFreeze(this.resultArray.get())
      this.resultArray.set(this.config.useAfterRender(vs) as any[])
    }
  }
  /**
   * 创建一个固定节点,该节点是不是MapFiber不一定
   * @param rd 
   * @param dynamicChild 
   */
  static createFix<D>(
    envModel: EnvModel,
    parentFiber: Fiber,
    config: FiberConfig,
    shouldChange: (a: D, b: D) => any,
    rd: RenderDeps<D>,
    dynamicChild?: boolean
  ) {
    const fiber = new Fiber(
      envModel,
      parentFiber,
      storeRef(undefined),
      storeRef(undefined),
      config,
      shouldChange,
      rd,
      dynamicChild)
    return fiber
  }

  /**
   * Map的子节点,子节点是不是Map不一定
   * @param parentFiber 
   * @param rd 
   * @param dynamicChild 
   */
  static createMapChild<D>(
    envModel: EnvModel,
    parentFiber: Fiber,
    config: FiberConfig,
    shouldChange: (a: D, b: D) => any,
    rd: RenderDeps<D>,
    dynamicChild?: boolean
  ) {
    const fiber = new Fiber(
      envModel,
      parentFiber,
      envModel.createChangeAtom(undefined),
      envModel.createChangeAtom(undefined),
      config,
      shouldChange,
      rd,
      dynamicChild)
    return fiber
  }
  /**
   * One的子节点,子节点是不是Map不一定
   * @param parentFiber 
   * @param rd 
   * @param dynamicChild 
   */
  static createOneChild<D>(
    envModel: EnvModel,
    parentFiber: Fiber,
    config: FiberConfig,
    shouldChange: (a: D, b: D) => any,
    rd: RenderDeps<D>,
    dynamicChild?: boolean
  ) {
    const fiber = new Fiber(
      envModel,
      parentFiber,
      emptyPlace,
      emptyPlace,
      config,
      shouldChange,
      rd,
      dynamicChild)
    return fiber
  }
}
const emptyPlace = storeRef<Fiber | void>(undefined)


export type MemoEvent<T> = {
  trigger: T
  isInit: boolean
  beforeTrigger?: T
}
export type RenderWithDep<T> = [
  (a: T, b: T) => any,
  (e: MemoEvent<T>) => void,
  T
]

export type VirtaulDomNode<T = any> = {
  useUpdate(props: T, isFirst: boolean): void
  isPortal?: boolean
  //创建
  //在update之前,所以要更新props
  // isPortal(): boolean
  appendAfter(value: FindParentAndBefore): void
  //只对部分元素执行删除
  removeFromParent(): void
  //所有都会执行
  destroy(): void
}
export type StoreValue<T> = {
  setFiber(v: Fiber): void
  get(): T
  set(v: T, callback?: () => void): void
}