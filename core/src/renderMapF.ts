import { FiberImpl, Fiber, StoreValueCreater } from "./Fiber"
import { draftParentFiber, revertParentFiber, renderBaseFiber, useBaseMemo, hookParentFiber, hookLevelEffect, hookAddResult } from "./fc"
import { alawaysFalse, storeRef } from "wy-helper"

////////****useMap****////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**
 nextCache, 
 key, 
 afterRender, 
 childShouldChange, 
 rowRender, 
 deps
 */
export type MapRowRender<C, T> = readonly [
  C,
  any,
  StoreValueCreater,
  (a: T, b: T) => any,
  (v: T) => void,
  T,
]
function createMapRef() {
  return storeRef(new Map<any, FiberImpl[]>())
}

export type RenderMapStoreValueCreater<A = any, B = any> = StoreValueCreater<readonly Fiber<A>[], B>
/**
 * 这里不预设加入portal里,是为了可能的portal
 * @param data 
 * @param translate 
 * @param render 
 * @param deps 
 */
export function renderMapF<M, C, D>(
  data: M,
  initCache: C,
  hasValue: (v: M, c: C) => boolean,
  storeValueCreater: RenderMapStoreValueCreater,
  shouldChange: (a: D, b: D) => any,
  render: (row: M, c: C) => MapRowRender<C, any>,
  deps: D
) {
  return renderBaseFiber(
    true,
    storeValueCreater,
    shouldChange,
    function () {
      const mapRef = useBaseMemo(alawaysFalse, createMapRef, undefined);
      const oldMap = cloneMap(mapRef.get())
      const newMap = new Map<any, FiberImpl[]>()
      hookLevelEffect(0, function () {
        mapRef.set(newMap)
      })
      const parentFiber = hookParentFiber()

      let beforeFiber: FiberImpl | undefined = undefined
      //提前置空
      parentFiber.firstChild.set(undefined!)
      parentFiber.lastChild.set(undefined!)
      let cache = initCache
      while (hasValue(data, cache)) {
        draftParentFiber()
        const [nextCache, key, childConfig, childShouldChange, rowRender, deps] = render(data, cache)
        cache = nextCache
        revertParentFiber()

        const oldFibers = oldMap.get(key)
        let currentFiber = oldFibers?.[0]
        if (currentFiber) {
          //因为新排序了,必须产生draft用于排序,
          currentFiber.changeRender(rowRender, deps)
          currentFiber.before.set(beforeFiber)
          oldFibers?.shift()
        } else {
          const tempFiber = FiberImpl.createMapChild(
            parentFiber.envModel,
            parentFiber,
            childConfig,
            childShouldChange,
            {
              render: rowRender,
              deps,
              isNew: true
            })
          tempFiber.before.set(beforeFiber!)
          currentFiber = tempFiber
        }
        const newFibers = newMap.get(key) || []
        if (newFibers.length > 0) {
          console.warn(`重复的key---重复${newFibers.length}次数`, key)
        }
        newFibers.push(currentFiber)
        newMap.set(key, newFibers)

        //构建双向树
        if (beforeFiber) {
          beforeFiber.next.set(currentFiber)
        } else {
          parentFiber.firstChild.set(currentFiber)
        }
        parentFiber.lastChild.set(currentFiber)
        currentFiber.next.set(undefined)

        beforeFiber = currentFiber

        hookAddResult(currentFiber)
      }

      for (const olds of oldMap.values()) {
        for (const old of olds) {
          //需要清理,以保证不会删除错误
          old.before.set(undefined)
          old.next.set(undefined)
          parentFiber.envModel.addDelect(old)
        }
      }

    }, deps)
}
export function cloneMap<T>(map: Map<any, T[]>) {
  const newMap = new Map<any, T[]>()
  map.forEach(function (v, k) {
    newMap.set(k, v.slice())
  })
  return newMap
}