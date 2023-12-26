import { VirtaulDomNode } from "better-react";
import { EnvModel, GetAstNextTimeWork } from "./commitWork";
import { Fiber } from "./Fiber";
import { Reconcile } from "./reconcile";
export { getEmptyArray } from './util'
export type { GetAstNextTimeWork, FindParentAndBefore } from './commitWork'
export { useLevelEffect, useComputed, useModel, createContext, renderFiber } from './fc'
export { renderMapF } from './renderMapF'
export { renderOneF } from './renderOneF'

export function render<T>(
  dom: VirtaulDomNode<T>,
  render: () => void,
  getAsk: GetAstNextTimeWork
) {

  const rootFiber = Fiber.create(null!, dom, {
    render
  })
  const reconcile = new Reconcile(rootFiber, getAsk)
  const envModel = new EnvModel(reconcile)
  envModel.requestRender()
  return function () {
    reconcile.destroy(envModel)
  }
}