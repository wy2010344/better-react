import { EmptyFun } from "wy-helper"
import { Fiber, LayoutEffect } from "./Fiber"
import { AbsTempOps, TempOps } from "./tempOps"

const w = globalThis as any
const cache = (w.__better_react_one__ || {
  effect: undefined,
  tempOps: undefined,
  wipFiber: undefined,
  allowWipFiber: false
}) as {
  effect?: LayoutEffect
  tempOps?: AbsTempOps<any>
  wipFiber?: Fiber
  allowWipFiber?: boolean
}
w.__better_react_one__ = cache

export function hookAddFiber(fiber?: Fiber) {
  cache.wipFiber = fiber
  cache.tempOps = fiber?.subOps
}

export function hookParentFiber() {
  if (cache.allowWipFiber) {
    return cache.wipFiber!
  }
  console.error('禁止在此处访问fiber')
  throw new Error('禁止在此处访问fiber')
}
export function draftParentFiber() {
  cache.allowWipFiber = false
}
export function revertParentFiber() {
  cache.allowWipFiber = true
}


export function hookTempOps() {
  if (cache.tempOps) {
    return cache.tempOps
  } else {
    throw new Error("未找到对应的tempOps")
  }
}

export function hookBeginTempOps(op: TempOps<any>) {
  const before = cache.tempOps
  cache.tempOps = op
  op.data.reset()
  return before
}
export function hookEndTempOps(op: AbsTempOps<any>) {
  cache.tempOps = op
}

export function hookAddResult(...vs: any[]) {
  if (!cache.tempOps) {
    throw new Error("必须在render中进行")
  }
  for (let i = 0; i < vs.length; i++) {
    cache.tempOps.addNode(vs[i])
  }
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