import { Fiber, FiberConfig } from "./Fiber"
import { batchWork, getReconcile } from "./reconcile"
import { EnvModel } from "./commitWork"
import { AskNextTimeWork, alawaysTrue } from "wy-helper"
export { startTransition } from './reconcile'
export {
  useLevelEffect, useBaseMemo,
  createContext, renderFiber,
  hookCreateChangeAtom,
  hookAddResult,
  hookCommitAll,
  hookEffectTag,
  hookRequestReconcile,
  hookMakeDirtyAndRequestUpdate
} from './fc'
export type { EffectResult, EffectEvent } from './fc'
export type {
  Fiber,
  VirtaulDomNode,
  RenderWithDep,
  MemoEvent,
  EffectDestroyEvent,
  FiberConfig
} from './Fiber'
export { CreateChangeAtom } from './commitWork'
export * from './renderMapF'
export function render<T>(
  config: FiberConfig,
  render: () => void,
  getAsk: AskNextTimeWork
) {
  const envModel = new EnvModel()
  const rootFiber = Fiber.createFix(envModel, null!, config, alawaysTrue, {
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

