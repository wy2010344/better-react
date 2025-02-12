import { EnvModel } from "./commitWork"
import { GetValue, StoreRef, ValueCenter, alawaysFalse } from "wy-helper"
import { hookAlterStateHolder, hookStateHoder } from "./cache"
import { Context } from "./context"
import { Fiber } from "./Fiber"
import { HookEffect } from "./effect"
import { HookMemo, MemoEvent, useBaseMemo } from "./memo"

export class StateHolder {
  constructor(
    public readonly envModel: EnvModel,
    public readonly fiber: Fiber,
    public readonly parent: StateHolder,
    /**
     * 在父节点的第几位
     */
    public readonly parentContextIndex: number
  ) {
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
  fibers?: Fiber[]


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

export function renderStateHolder<T>(fun: GetValue<T>) {
  const parentEnv = hookStateHoder()
  const env = useBaseMemo(alawaysFalse, createFun, parentEnv)
  if (env.contextIndex != parentEnv.contextIndex) {
    throw "contextIndex不匹配"
  }
  env.beginRun()
  const a = fun()
  env.endRun()
  return a
}

export function hookFirstTime() {
  const holder = hookStateHoder()
  return holder.firstTime
}