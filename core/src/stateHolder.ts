import { EnvModel } from "./commitWork"
import { EmptyFun, StoreRef, ValueCenter, alawaysFalse } from "wy-helper"
import { hookAlterStateHolder, hookStateHoder } from "./cache"
import { Context } from "./context"
import { Fiber } from "./Fiber"
import { EffectDestroyEvent } from "./effect"
import { MemoEvent, useBaseMemo } from "./memo"

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


function createFun(e: MemoEvent<StateHolder, StateHolder>) {
  return StateHolder.from(e.trigger)
}

export function renderStateHolder(fun: EmptyFun) {
  const parentEnv = hookStateHoder()
  const env = useBaseMemo(alawaysFalse, createFun, parentEnv)
  env.beginRun()
  fun()
  env.endRun()
}