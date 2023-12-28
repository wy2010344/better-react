import { Fiber, VirtaulDomNode } from "./Fiber"
import { AskNextTimeWork, BatchWork, getReconcile } from "./reconcile"
import { EnvModel } from "./commitWork"
export { startTransition } from './reconcile'
export type { REAL_WORK } from './reconcile'
export {
  useGetCreateChangeAtom,
  useBaseReducer, useLevelEffect, useBaseMemoGet,
  createContext, renderFiber, useGetFlushSync
} from './fc'
export type { ReducerResult, ReducerFun, EffectResult } from './fc'
export type {
  Fiber,
  VirtaulDomNode,
  RenderWithDep,
  VirtualDomOperator,
} from './Fiber'
export type { AskNextTimeWork }
export { CreateChangeAtom } from './commitWork'
export type { FindParentAndBefore } from './findParentAndBefore'
export * from './renderOneF'
export * from './renderMapF'
export function render<T>(
  dom: VirtaulDomNode<T>,
  render: () => void,
  getAsk: AskNextTimeWork
) {
  const envModel = new EnvModel()
  const rootFiber = Fiber.createFix(envModel, null!, dom, {
    render
  })
  const batchWork = new BatchWork(
    rootFiber,
    envModel
  )
  const reconcile = getReconcile(batchWork, envModel, getAsk)
  envModel.reconcile = reconcile
  //开始执行
  reconcile()
  return function () {
    batchWork.destroy()
  }
}

