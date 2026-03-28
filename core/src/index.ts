import { Fiber } from './Fiber'
import { WorkUnits } from './reconcile'
import { AskNextTimeWork, EmptyFun, alawaysTrue, emptyFun } from 'wy-helper'
import { AbsTempOps } from './tempOps'
import { IEnvModel } from './commitWork'
export { startTransition, flushSync } from './reconcile'
export { renderFiber, renderSubOps } from './fc'
export {
  hookRequestReconcile,
  hookMakeDirtyAndRequestUpdate,
} from './requestFresh'
export { createContext } from './context'
export type { Context } from './context'
export {
  hookBeginTempOps,
  hookEndTempOps,
  hookAddResult,
  // effectLayout,
  hookStateHoder,
} from './cache'
export type { IEnvModel }
export { useLevelEffect } from './effect'
export { useBaseMemo } from './memo'
export { renderStateHolder, hookFirstTime } from './stateHolder'
/**
 * @deprecated
 */
export type { MemoEvent } from 'wy-helper/state-function'
export { TempOps, TempSubOps } from './tempOps'
export type { TempReal } from './tempOps'
export type {
  EffectResult,
  EffectEvent,
  EffectDestroy,
  EffectDestroyEvent,
} from './effect'
export type { Fiber, RenderWithDep, FiberEvent } from './Fiber'
export { hookEnvModel } from './cache'
export * from './renderForEach'
export { layoutEffect } from './reconcile'
export function render(
  getSubOps: () => AbsTempOps<any>,
  render: EmptyFun,
  getAsk: AskNextTimeWork<IEnvModel>,
) {
  const rootFiber = Fiber.create(null!, {
    shouldChange: alawaysTrue,
    render,
    event: {
      trigger: undefined,
      isInit: true,
    },
  })
  rootFiber.subOps = getSubOps()

  const workUnit = new WorkUnits(rootFiber, getAsk)
  workUnit.reconcile(emptyFun)
  return function () {
    workUnit.reconcile(function (env) {
      env.addDelete(rootFiber.stateHoder)
    })
  }
}
