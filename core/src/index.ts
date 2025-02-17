import { Fiber } from "./Fiber"
import { batchWork, getReconcile } from "./reconcile"
import { CreateChangeAtom, EnvModel } from "./commitWork"
import { AskNextTimeWork, EmptyFun, alawaysTrue } from "wy-helper"
import { AbsTempOps } from "./tempOps"
export { startTransition, flushSync } from './reconcile'
export {
  renderFiber,
  renderSubOps
} from './fc'
export {
  hookRequestReconcile,
  hookMakeDirtyAndRequestUpdate
} from './requestFresh'
export { createContext } from './context'
export type { Context } from './context'
export {
  hookBeginTempOps,
  hookEndTempOps,
  hookAddResult,
  effectLayout,
  hookStateHoder
} from './cache'
export {
  useLevelEffect
} from './effect'
export { useBaseMemo } from './memo'
export { renderStateHolder, hookFirstTime } from './stateHolder'
export type { MemoEvent } from './memo'
export {
  TempOps,
  TempSubOps,
} from './tempOps'
export type { TempReal } from './tempOps'
export type { EffectResult, EffectEvent, EffectDestroy, EffectDestroyEvent } from './effect'
export type {
  Fiber,
  RenderWithDep,
  FiberEvent,
} from './Fiber'
export type { CreateChangeAtom } from './commitWork'
export { hookEnvModel } from './commitWork'
export * from './renderForEach'
export function render(
  getSubOps: (createChangeAtom: CreateChangeAtom<any>) => AbsTempOps<any>,
  render: EmptyFun,
  getAsk: AskNextTimeWork
) {
  const envModel = new EnvModel()
  const rootFiber = Fiber.create(envModel, null!, {
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
