import { FiberImpl } from "./Fiber"
import { batchWork, getReconcile } from "./reconcile"
import { CreateChangeAtom, EnvModel } from "./commitWork"
import { AskNextTimeWork, EmptyFun, alawaysTrue } from "wy-helper"
import { AbsTempOps } from "./tempOps"
export { startTransition, flushSync } from './reconcile'
export {
  hookLevelEffect,
  useLevelEffect, useBaseMemo,
  createContext, renderFiber,
  hookCreateChangeAtom,
  hookCommitAll,
  hookEffectTag,
  hookRequestReconcile,
  hookMakeDirtyAndRequestUpdate
} from './fc'
export {
  hookBeginTempOps,
  hookEndTempOps,
  hookAddResult
} from './cache'
export {
  TempOps,
  TempSubOps,
  TempReal
} from './tempOps'
export type { EffectResult, EffectEvent, EffectDestroy } from './fc'
export type {
  Fiber,
  RenderWithDep,
  MemoEvent,
  EffectDestroyEvent,
  StoreValue
} from './Fiber'
export { isFiber } from './Fiber'
export { CreateChangeAtom } from './commitWork'
export * from './renderMapF'
export function render(
  getSubOps: (createChangeAtom: CreateChangeAtom<any>) => AbsTempOps<any>,
  render: EmptyFun,
  getAsk: AskNextTimeWork
) {
  const envModel = new EnvModel()
  const rootFiber = FiberImpl.createFix(envModel, null!, alawaysTrue, {
    render,
    isNew: true,
    deps: undefined
  })
  rootFiber.subOps = getSubOps(envModel.createChangeAtom)
  const { destroy, beginRender } = batchWork(
    rootFiber,
    envModel
  )
  const reconcile = getReconcile(beginRender, envModel, getAsk)
  envModel.reconcile = reconcile
  //开始执行
  reconcile()
  return destroy
}
