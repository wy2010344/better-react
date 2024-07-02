import { EnvModel } from "./commitWork"
import { EmptyFun, storeRef, StoreRef, ValueCenter } from "wy-helper"
import { AbsTempOps } from "./tempOps"
import { hookAlterStateHolder, hookStateHoder } from "./cache"
import { Context } from "./fc"

export type HookMemo<T, D> = {
  shouldChange(a: D, b: D): any,
  deps: D
  value: T
}

export type HookEffect<V, D> = {
  level: number,
  shouldChange(a: D, b: D): any
  deps: D
  value?: V
  isInit: boolean
  destroy?: void | ((newDeps: EffectDestroyEvent<V, D>) => void)
}

export type LayoutEffect = (fun: EmptyFun) => void
export type EffectDestroyEvent<V, T> = {
  isDestroy: false
  trigger: T
  value: V,
  beforeIsInit: boolean,
  beforeTrigger: T
  setRealTime(): void
} | {
  isDestroy: true
  trigger?: never
  value: V,
  beforeIsInit: boolean,
  beforeTrigger: T
  setRealTime(): void
}
type RenderDeps<D> = {
  shouldChange: (a: D, b: D) => any,
  render(e: FiberEvent<D>): void
  event: FiberEvent<D>
}

type EffectTag = "PLACEMENT" | "UPDATE" | void
function whenCommitEffectTag(v: EffectTag) {
  return undefined
}

export type ReconcileFun = (fun: (updateEffect: (level: number, set: EmptyFun) => void) => any) => void


export class StateHolder {
  readonly parentContextIndex: StoreRef<number>
  constructor(
    public readonly envModel: EnvModel,
    public readonly fiber: Fiber,
    public readonly parent: StateHolder,
    /**
     * 在父节点的第几位
     */
    initParentContextIndex: number
  ) {
    this.parentContextIndex = envModel.createChangeAtom(initParentContextIndex)
  }
  static from(parent: StateHolder) {
    return new StateHolder(
      parent.envModel,
      parent.fiber,
      parent,
      parent.contextIndex
    )
  }
  /**是否已经销毁 */
  destroyed?: boolean
  firstTime = true

  children?: Set<StateHolder>

  contexts?: {
    key: Context<any>,
    value: ValueCenter<any>
  }[]
  effects?: StoreRef<HookEffect<any, any>>[]
  memos?: StoreRef<HookMemo<any, any>>[]
  fibers?: Fiber[] = []


  contextIndex = 0
  effectIndex = 0
  memoIndex = 0
  fiberIndex = 0
  beginRun() {
    hookAlterStateHolder(this)
    this.contextIndex = 0
    this.effectIndex = 0
    this.memoIndex = 0
    this.fiberIndex = 0
  }
  endRun() {
    this.firstTime = false
    hookAlterStateHolder(this.parent)
  }
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
export class Fiber<D = any> {
  /**初始化或更新 
   * UPDATE可能是setState造成的,可能是更新造成的
   * 这其中要回滚
   * 当提交生效的时候,自己的值变空.回滚的时候,也变成空
  */
  readonly effectTag: StoreRef<EffectTag> = this.envModel.createChangeAtom<EffectTag>("PLACEMENT", whenCommitEffectTag)
  /**顺序*/
  readonly firstChild: StoreRef<Fiber | void> = this.envModel.createChangeAtom(undefined)
  readonly lastChild: StoreRef<Fiber | void> = this.envModel.createChangeAtom(undefined)

  private renderDeps: StoreRef<RenderDeps<any>>

  requestReconcile: (ReconcileFun) | void = undefined
  makeDirtyAndRequestUpdate: EmptyFun | void = undefined
  private constructor(
    public readonly envModel: EnvModel,
    public readonly parent: Fiber | undefined,
    public readonly before: StoreRef<Fiber | void>,
    public readonly next: StoreRef<Fiber | void>,
    rd: RenderDeps<any>
  ) {
    this.renderDeps = envModel.createChangeAtom(rd)

    const parentHolder = hookStateHoder()
    this.stateHoder = new StateHolder(
      this.envModel,
      this,
      parentHolder,
      parentHolder?.contextIndex
    )

    if (parentHolder) {
      parentHolder.children = parentHolder.children || new Set()
      parentHolder.children.add(this.stateHoder)
    }
  }
  changeRender(
    shouldChange: (a: D, b: D) => any,
    render: (e: FiberEvent<D>) => void,
    deps: D
  ) {
    const { event, shouldChange: beforeShouldChange } = this.renderDeps.get()
    if (beforeShouldChange(event.trigger, deps)) {
      //能改变render,需要UPDATE
      this.renderDeps.set({
        shouldChange,
        render,
        event: {
          trigger: deps,
          beforeTrigger: event.trigger,
          isInit: false
        }
      })
      this.effectTag.set("UPDATE")
    }
  }
  stateHoder: StateHolder
  subOps!: AbsTempOps<any>
  render() {
    const { render, event } = this.renderDeps.get()
    this.subOps.reset()
    this.stateHoder.beginRun()
    render(event)
    this.stateHoder.endRun()
  }
  /**
   * Map的子节点,子节点是不是Map不一定
   * @param parentFiber 
   * @param rd 
   * @param dynamicChild 
   */
  static create<D>(
    envModel: EnvModel,
    parentFiber: Fiber,
    rd: RenderDeps<D>
  ) {
    const fiber = new Fiber(
      envModel,
      parentFiber,
      envModel.createChangeAtom(undefined),
      envModel.createChangeAtom(undefined),
      rd)
    return fiber
  }
}
export type FiberEvent<T> = {
  trigger: T
  isInit: boolean
  beforeTrigger?: T
}
export type RenderWithDep<T> = [
  (a: T, b: T) => any,
  (e: FiberEvent<T>) => void,
  T
]