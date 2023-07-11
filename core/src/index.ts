import { Fiber, VirtaulDomNode } from "./Fiber"
import { AskNextTimeWork, BatchWork, getReconcile } from "./reconcile"
import { EnvModel } from "./commitWork"
import { emptyObject } from "./util"
export { startTransition } from './reconcile'
export type { REAL_WORK } from './reconcile'
export {
  createChangeAtom,
  useBaseReducer, useEffect, useAttrEffect, useBeforeAttrEffect, useBaseMemoGet,
  createContext, renderFiber
} from './fc'
export {
  arrayNotEqualDepsWithEmpty,
  arrayEqual, simpleEqual,
  storeRef,
  quote,
  emptyArray,
  emptyObject,
  emptyFun,
  expandFunCall,
  expandFunReturn
} from './util'
export type { ReducerResult, ReducerFun, ValueNotify } from './fc'
export type {
  Fiber, Props,
  VirtaulDomNode,
  HookValueSet,
  RenderWithDep,
  VirtualDomOperator,
} from './Fiber'
export type { AskNextTimeWork }
export { StoreRef } from './commitWork'
export type { FindParentAndBefore } from './findParentAndBefore'
export * from './renderOneF'
export * from './renderMapF'
export type { FalseType, EmptyFun, AnyFunction } from './util'

export function render<T>(
  dom: VirtaulDomNode<T>,
  props: T,
  render: () => void,
  layout: () => void,
  getAsk: AskNextTimeWork
) {
  const envModel = new EnvModel()
  const rootFiber = Fiber.createFix(envModel, null!, dom, {
    render() {
      dom.useUpdate(props)
      render()
    }
  })
  const batchWork = new BatchWork(
    rootFiber,
    envModel,
    layout
  )
  const reconcile = getReconcile(batchWork, envModel, getAsk)
  envModel.reconcile = reconcile
  //开始执行
  reconcile(emptyObject)
  return function () {
    batchWork.destroy()
  }
}

