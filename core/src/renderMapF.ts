import { Fiber, FiberConfig } from "./Fiber"
import { draftParentFiber, revertParentFiber, renderBaseFiber, useBaseMemo, hookParentFiber, useLevelEffect } from "./fc"
import { alawaysFalse, alawaysTrue, storeRef } from "wy-helper"

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
  FiberConfig,
  (a: T, b: T) => any,
  (v: T) => void,
  T,
]
function createMapRef() {
  return storeRef(new Map<any, Fiber[]>())
}

export type UseAfterRenderMap = (vs: readonly (() => any[])[]) => readonly any[]
/**
 * 最大兼容优化,减少过程中的声明
 * @param data 
 * @param translate 
 * @param render 
 * @param deps 
 */
export function renderMapF<M, C, D>(
  data: M,
  initCache: C,
  hasValue: (v: M, c: C) => boolean,
  useAfterRender: UseAfterRenderMap,
  shouldChange: (a: D, b: D) => any,
  render: (row: M, c: C) => MapRowRender<C, any>,
  deps: D
): void {
  const config = useBaseMemo<FiberConfig, undefined>(alawaysFalse, () => {
    return {
      allowFiber: true,
      allowAdd: alawaysFalse,
      useAfterRender: useAfterRender
    }
  }, undefined)
  if (config.useAfterRender != useAfterRender) {
    console.log('AfterRenderChange', config, useAfterRender)
    throw new Error('AfterRenderChange')
  }
  renderBaseFiber(
    true,
    config,
    shouldChange,
    function () {
      const mapRef = useBaseMemo(alawaysFalse, createMapRef, undefined);
      const oldMap = cloneMap(mapRef.get())
      const newMap = new Map<any, Fiber[]>()
      useLevelEffect(0, alawaysTrue, function () {
        mapRef.set(newMap)
      }, undefined)
      const parentFiber = hookParentFiber()

      let beforeFiber: Fiber | undefined = undefined
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
          const tempFiber = Fiber.createMapChild(
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

        parentFiber.resultArray.get().push(currentFiber.lazyGetResultArray)
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