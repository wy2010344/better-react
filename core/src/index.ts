import { FiberImpl, StoreValueCreater } from "./Fiber"
import { batchWork, getReconcile } from "./reconcile"
import { EnvModel } from "./commitWork"
import { AskNextTimeWork, alawaysTrue } from "wy-helper"
export { startTransition, flushSync } from './reconcile'
export {
  hookLevelEffect,
  useLevelEffect, useBaseMemo,
  createContext, renderFiber,
  hookCreateChangeAtom,
  hookAddResult,
  hookCommitAll,
  hookEffectTag,
  hookRequestReconcile,
  hookMakeDirtyAndRequestUpdate
} from './fc'
export type { EffectResult, EffectEvent, EffectDestroy } from './fc'
export type {
  Fiber,
  RenderWithDep,
  MemoEvent,
  EffectDestroyEvent,
  StoreValueCreater,
  StoreValue
} from './Fiber'
export { isFiber } from './Fiber'
export { CreateChangeAtom } from './commitWork'
export * from './renderMapF'
export function render(
  storeValueCreater: StoreValueCreater,
  render: () => void,
  getAsk: AskNextTimeWork
) {
  const envModel = new EnvModel()
  const rootFiber = FiberImpl.createFix(envModel, null!, storeValueCreater, alawaysTrue, {
    render,
    isNew: true,
    deps: undefined
  })
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

