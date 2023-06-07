import { addDelect } from "./commitWork"
import {
  draftParentFiber, EMPTYCONSTARRAY,
  revertParentFiber, useBaseFiber, useBeforeAttrEffect, useParentFiber,
  useEffect, useMemoGet
} from "./fc"
import { storeRef } from './util'
import { Fiber, VirtaulDomNode, VirtualDomOperator } from "./Fiber"
import { AskNextTimeWork, setRootFiber } from "./reconcile"
export { flushSync, startTransition } from './reconcile'
export type { REAL_WORK } from './reconcile'
export {
  useReducer, useEffect, useAttrEffect, useBeforeAttrEffect, useMemoGet,
  createContext, useFiber, quote, EMPTYCONSTARRAY
} from './fc'
export {
  arrayNotEqualDepsWithEmpty,
  arrayEqual, simpleEqual,
  storeRef
} from './util'
export type { ReducerResult, ReducerFun } from './fc'
export type {
  Fiber, Props,
  VirtaulDomNode,
  FindParentAndBefore,
  HookValueSet,
  RenderWithDep,
  VirtualDomOperator
} from './Fiber'
export type { AskNextTimeWork }
export { createChangeAtom, ChangeAtomValue } from './commitWork'

export function render<T>(
  dom: VirtaulDomNode<T>,
  props: T,
  render: () => void,
  ask: AskNextTimeWork
) {
  const rootFiber = Fiber.createFix(null!, {
    render() {
      dom.useUpdate(props)
      render()
    }
  })
  rootFiber.dom = dom
  return setRootFiber(rootFiber, ask)
}

////////****useMap****////////////////////////////////////////////////////////////////////////////////////////////////////////////
export type Translate<M, T> = {
  size(m: M): number
  get(m: M, i: number): T
}
export type MapRowRender<T extends any[]> = readonly [
  any,
  (v: T) => void,
  T,
] | readonly [
  any,
  () => void
]
function createMapRef() {
  return storeRef(new Map<any, Fiber[]>())
}

/**
 * 最大兼容优化,减少过程中的声明
 * @param data 
 * @param translate 
 * @param render 
 * @param deps 
 */
export function useMapF<M, K>(
  dom: VirtualDomOperator,
  data: M,
  translate: Translate<M, K>,
  /**中间不允许hooks,应该处理一下*/
  render: (row: K, i: number) => MapRowRender<any>,
  deps?: readonly any[]
): VirtaulDomNode
export function useMapF<M, K>(
  dom: void,
  data: M,
  translate: Translate<M, K>,
  /**中间不允许hooks,应该处理一下*/
  render: (row: K, i: number) => MapRowRender<any>,
  deps?: readonly any[]
): void
export function useMapF<M, K>(
  dom: any,
  data: M,
  translate: Translate<M, K>,
  /**中间不允许hooks,应该处理一下*/
  render: (row: K, i: number) => MapRowRender<any>,
  deps?: readonly any[]
) {
  return useBaseFiber(dom, true, function () {
    const mapRef = useMemoGet(createMapRef, EMPTYCONSTARRAY)();
    const oldMap = cloneMap(mapRef.get())
    const newMap = new Map<any, Fiber[]>()
    useBeforeAttrEffect(function () {
      mapRef.set(newMap)
    })
    const parentFiber = useParentFiber()

    let beforeFiber: Fiber | undefined = undefined
    //提前置空
    parentFiber.firstChild.set(undefined!)
    parentFiber.lastChild.set(undefined!)

    const maxSize = translate.size(data)
    for (let i = 0; i < maxSize; i++) {
      const v = translate.get(data, i)

      draftParentFiber()
      const [key, rowRender, deps] = render(v, i)
      revertParentFiber()

      const oldFibers = oldMap.get(key)
      let oldFiber = oldFibers?.[0]
      if (oldFiber) {
        //因为新排序了,必须产生draft用于排序,
        oldFiber.changeRender(rowRender, deps)
        oldFiber.before.set(beforeFiber)
        oldFibers?.shift()
      } else {
        const tempFiber = Fiber.createMapChild(parentFiber, {
          render: rowRender,
          deps
        })
        tempFiber.before.set(beforeFiber!)
        oldFiber = tempFiber
      }
      const newFibers = newMap.get(key) || []
      if (newFibers.length > 0) {
        console.warn(`重复的key---重复${newFibers.length}次数`, key)
      }
      newFibers.push(oldFiber)
      newMap.set(key, newFibers)

      //构建双向树
      if (beforeFiber) {
        beforeFiber.next.set(oldFiber)
      } else {
        parentFiber.firstChild.set(oldFiber)
      }
      parentFiber.lastChild.set(oldFiber)
      oldFiber.next.set(undefined)

      beforeFiber = oldFiber
    }

    for (const olds of oldMap.values()) {
      for (const old of olds) {
        addDelect(old)
      }
    }

  }, deps!)
}
export function cloneMap<T>(map: Map<any, T[]>) {
  const newMap = new Map<any, T[]>()
  map.forEach(function (v, k) {
    newMap.set(k, v.slice())
  })
  return newMap
}
////////****single****////////////////////////////////////////////////////////////////////////////////////////////////////////////
type OneProps<T extends readonly any[] = readonly any[]> = readonly [any, (deps: T) => void, T]
  | readonly [any, () => void]

function initCache() {
  return {} as {
    key?: any,
    fiber?: Fiber
  }
}
export function useOneF<M>(
  dom: VirtualDomOperator,
  data: M,
  outRender: (data: M) => OneProps<any[]>,
  outDeps?: readonly any[]
): VirtaulDomNode
export function useOneF<M>(
  dom: void,
  data: M,
  outRender: (data: M) => OneProps<any[]>,
  outDeps?: readonly any[]
): void
export function useOneF<M>(
  dom: any,
  data: M,
  outRender: (data: M) => OneProps<any[]>,
  outDeps?: readonly any[]
) {
  return useBaseFiber(dom, true, function () {
    draftParentFiber()
    const [key, render, deps] = outRender(data)
    revertParentFiber()

    let commitWork: (() => void) | void = undefined
    const fiber = useParentFiber()
    const cache = useMemoGet(initCache, EMPTYCONSTARRAY)()
    if (cache.key == key && cache.fiber) {
      //key相同复用
      cache.fiber.changeRender(render as any, deps)
    } else {
      //删旧增新
      if (cache.fiber) {
        //节点存在
        addDelect(cache.fiber)
      }
      const placeFiber = Fiber.createOneChild(fiber, { render, deps })
      commitWork = () => {
        cache.key = key
        cache.fiber = placeFiber
      }
      //只有一个节点,故是同一个
      fiber.lastChild.set(placeFiber)
      fiber.firstChild.set(placeFiber)
    }

    useEffect(() => {
      if (commitWork) {
        commitWork()
      }
    })
  }, outDeps!)
}