import { EmptyFun } from "wy-helper"
import { Fiber } from "./Fiber"
import { AbsTempOps, TempOps, TempReal } from "./tempOps"
import { StateHolder } from "./stateHolder"
import { LayoutEffect } from "./effect"

const w = globalThis as any
const cache = (w.__better_react_one__ || {}) as {
  effect?: LayoutEffect
  tempOps?: AbsTempOps<TempReal>
  stateHolder?: StateHolder
  beforeFiber?: Fiber
}
w.__better_react_one__ = cache

export function hookSetBeforeFiber(fiber?: Fiber) {
  cache.beforeFiber = fiber
}
export function hookBeforeFiber() {
  return cache.beforeFiber
}

export function hookStateHoder() {
  return cache.stateHolder!
}

export function hookAlterStateHolder(holder?: StateHolder) {
  cache.stateHolder = holder
}

export function hookTempOps() {
  if (cache.tempOps) {
    return cache.tempOps
  } else {
    throw new Error("未找到对应的tempOps")
  }
}

export function hookBeginTempOps(op: AbsTempOps<any>) {
  const before = cache.tempOps
  cache.tempOps = op
  op.reset()
  return before!
}
export function hookEndTempOps(op: AbsTempOps<any>) {
  cache.tempOps = op
}

export function hookAddResult(...vs: any[]) {
  if (!cache.tempOps) {
    throw new Error("必须在render中进行")
  }
  cache.tempOps.data.add.apply(cache.tempOps.data, arguments as unknown as any[])
}


export function hookAddEffect(effect?: LayoutEffect) {
  cache.effect = effect
}

export function effectLayout(fun: EmptyFun) {
  if (cache.effect) {
    cache.effect(fun)
  } else {
    throw new Error("请在effect中执行")
  }
}