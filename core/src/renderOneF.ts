import { Fiber, VirtaulDomNode, VirtualDomOperator } from "./Fiber"
import { draftParentFiber, revertParentFiber, renderBaseFiber, useBaseMemoGet, hookParentFiber, useLevelEffect } from "./fc"
import { alawaysFalse, alawaysTrue } from "wy-helper"
////////****single****////////////////////////////////////////////////////////////////////////////////////////////////////////////
type OneProps<T> = readonly [
  any,
  VirtaulDomNode | undefined,
  (a: T, b: T) => any,
  (deps: T) => void,
  T
]

function initCache() {
  return {} as {
    key?: any,
    fiber?: Fiber
  }
}
export function renderOneF<M, D>(
  dom: VirtualDomOperator,
  data: M,
  shouldChange: (a: D, b: D) => any,
  outRender: (data: M) => OneProps<any>,
  outDeps: D
): VirtaulDomNode
export function renderOneF<M, D>(
  dom: void,
  data: M,
  shouldChange: (a: D, b: D) => any,
  outRender: (data: M) => OneProps<any>,
  outDeps: D
): void
export function renderOneF<M, D>(
  dom: any,
  data: M,
  shouldChange: (a: D, b: D) => any,
  outRender: (data: M) => OneProps<any>,
  outDeps: D
) {
  return renderBaseFiber(dom, true, shouldChange, function () {
    draftParentFiber()
    const [key, dom, childShouldChange, render, deps] = outRender(data)
    revertParentFiber()

    let commitWork: (() => void) | void = undefined
    const parentFiber = hookParentFiber()
    const cache = useBaseMemoGet(alawaysFalse, initCache, undefined)()
    if (cache.key == key && cache.fiber) {
      //key相同复用
      cache.fiber.changeRender(render as any, deps)
    } else {
      //删旧增新
      if (cache.fiber) {
        //节点存在
        parentFiber.envModel.addDelect(cache.fiber)
      }
      const placeFiber = Fiber.createOneChild(
        parentFiber.envModel,
        parentFiber,
        dom,
        childShouldChange,
        { render, deps, isNew: true })
      commitWork = () => {
        cache.key = key
        cache.fiber = placeFiber
      }
      //只有一个节点,故是同一个
      parentFiber.lastChild.set(placeFiber)
      parentFiber.firstChild.set(placeFiber)
    }

    useLevelEffect(0, alawaysTrue, () => {
      if (commitWork) {
        commitWork()
      }
    }, undefined)
  }, outDeps)
}