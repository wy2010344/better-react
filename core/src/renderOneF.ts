import { Fiber, VirtaulDomNode, VirtualDomOperator } from "./Fiber"
import { draftParentFiber, revertParentFiber, renderBaseFiber, useBaseMemoGet, useParentFiber, useLevelEffect } from "./fc"
import { emptyArray } from "./util"
////////****single****////////////////////////////////////////////////////////////////////////////////////////////////////////////
type OneProps<T extends readonly any[] = readonly any[]> = readonly [
  any,
  VirtaulDomNode | undefined,
  (deps: T) => void,
  T
] | readonly [any,
  VirtaulDomNode | undefined,
  () => void]

function initCache() {
  return {} as {
    key?: any,
    fiber?: Fiber
  }
}
export function renderOneF<M>(
  dom: VirtualDomOperator,
  data: M,
  outRender: (data: M) => OneProps<any[]>,
  outDeps?: readonly any[]
): VirtaulDomNode
export function renderOneF<M>(
  dom: void,
  data: M,
  outRender: (data: M) => OneProps<any[]>,
  outDeps?: readonly any[]
): void
export function renderOneF<M>(
  dom: any,
  data: M,
  outRender: (data: M) => OneProps<any[]>,
  outDeps?: readonly any[]
) {
  return renderBaseFiber(dom, true, function () {
    draftParentFiber()
    const [key, dom, render, deps] = outRender(data)
    revertParentFiber()

    let commitWork: (() => void) | void = undefined
    const [envModel, parentFiber] = useParentFiber()
    const cache = useBaseMemoGet(initCache, emptyArray)()
    if (cache.key == key && cache.fiber) {
      //key相同复用
      cache.fiber.changeRender(render as any, deps)
    } else {
      //删旧增新
      if (cache.fiber) {
        //节点存在
        envModel.addDelect(cache.fiber)
      }
      const placeFiber = Fiber.createOneChild(envModel, parentFiber, dom, { render, deps })
      commitWork = () => {
        cache.key = key
        cache.fiber = placeFiber
      }
      //只有一个节点,故是同一个
      parentFiber.lastChild.set(placeFiber)
      parentFiber.firstChild.set(placeFiber)
    }

    useLevelEffect(0, () => {
      if (commitWork) {
        commitWork()
      }
    })
  }, outDeps!)
}