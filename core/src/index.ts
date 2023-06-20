import {
  draftParentFiber, EMPTYCONSTARRAY,
  revertParentFiber, useBaseFiber, useBeforeAttrEffect, useParentFiber,
  useMemoGet
} from "./fc"
import { storeRef } from './util'
import { Fiber, VirtaulDomNode, VirtualDomOperator } from "./Fiber"
import { AskNextTimeWork, setRootFiber } from "./reconcile"
import { EnvModel } from "./commitWork"
export { startTransition } from './reconcile'
export type { REAL_WORK } from './reconcile'
export {
  createChangeAtom,
  useReducer, useEffect, useAttrEffect, useBeforeAttrEffect, useMemoGet,
  createContext, useFiber, EMPTYCONSTARRAY
} from './fc'
export {
  arrayNotEqualDepsWithEmpty,
  arrayEqual, simpleEqual,
  storeRef,
  quote
} from './util'
export type { ReducerResult, ReducerFun } from './fc'
export type {
  Fiber, Props,
  VirtaulDomNode,
  HookValueSet,
  RenderWithDep,
  VirtualDomOperator
} from './Fiber'
export type { AskNextTimeWork }
export { StoreRef } from './commitWork'
export type { FindParentAndBefore } from './findParentAndBefore'
export * from './useOneF'
export * from './useMapF'

export function render<T>(
  dom: VirtaulDomNode<T>,
  props: T,
  render: () => void,
  layout: () => void,
  getAsk: <M>(env: M) => AskNextTimeWork<M>
) {
  const envModel = new EnvModel(
    undefined,
    layout,
    getAsk
  )
  const rootFiber = Fiber.createFix(envModel, null!, dom, {
    render() {
      dom.useUpdate(props)
      render()
    }
  })
  envModel.rootFiber = rootFiber
  return setRootFiber(envModel)
}

