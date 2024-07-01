import { Fiber } from "./Fiber"
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
export type { MemoEvent } from './fc'
export {
  TempOps,
  TempSubOps,
  TempReal
} from './tempOps'
export type { EffectResult, EffectEvent, EffectDestroy } from './fc'
export type {
  Fiber,
  RenderWithDep,
  FiberEvent,
  EffectDestroyEvent,
  StoreValue
} from './Fiber'
export { CreateChangeAtom } from './commitWork'
export * from './renderMapF'
export function render(
  getSubOps: (createChangeAtom: CreateChangeAtom<any>) => AbsTempOps<any>,
  render: EmptyFun,
  getAsk: AskNextTimeWork
) {
  const envModel = new EnvModel()
  const rootFiber = Fiber.createFix(envModel, null!, {
    shouldChange: alawaysTrue,
    render,
    event: {
      trigger: undefined,
      isInit: true
    }
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
