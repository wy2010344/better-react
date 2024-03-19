import { Fiber, VirtaulDomNode, VirtualDomOperator } from "./Fiber"
import { draftParentFiber, revertParentFiber, renderBaseFiber, useBaseMemoGet, hookParentFiber, useLevelEffect } from "./fc"
import { alawaysFalse, alawaysTrue, storeRef } from "wy-helper"

////////****useMap****////////////////////////////////////////////////////////////////////////////////////////////////////////////
export type MapRowRender<C, T> = readonly [
  C,
  any,
  VirtaulDomNode | undefined,
  (a: T, b: T) => any,
  (v: T) => void,
  T,
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
export function renderMapF<M, C, D>(
  dom: VirtualDomOperator,
  data: M,
  initCache: C,
  hasValue: (v: M, c: C) => boolean,
  /**中间不允许hooks,应该处理一下*/
  shouldChange: (a: D, b: D) => any,
  render: (v: M, c: C) => MapRowRender<C, any>,
  deps: D
): VirtaulDomNode
export function renderMapF<M, C, D>(
  dom: void,
  data: M,
  initCache: C,
  hasValue: (v: M, c: C) => boolean,
  /**中间不允许hooks,应该处理一下*/
  shouldChange: (a: D, b: D) => any,
  render: (row: M, c: C) => MapRowRender<C, any>,
  deps: D
): void
export function renderMapF<M, C, D>(
  dom: any,
  data: M,
  initCache: C,
  hasValue: (v: M, c: C) => boolean,
  /**中间不允许hooks,应该处理一下*/
  shouldChange: (a: D, b: D) => any,
  render: (row: M, c: C) => MapRowRender<C, any>,
  deps: D
) {
  return renderBaseFiber(dom, true, shouldChange, function () {
    const mapRef = useBaseMemoGet(alawaysFalse, createMapRef, undefined)();
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
      const [nextCache, key, dom, childShouldChange, rowRender, deps] = render(data, cache)
      cache = nextCache
      revertParentFiber()

      const oldFibers = oldMap.get(key)
      let oldFiber = oldFibers?.[0]
      if (oldFiber) {
        //因为新排序了,必须产生draft用于排序,
        oldFiber.changeRender(rowRender, deps)
        oldFiber.before.set(beforeFiber)
        oldFibers?.shift()
      } else {
        const tempFiber = Fiber.createMapChild(
          parentFiber.envModel,
          parentFiber,
          dom,
          childShouldChange,
          {
            render: rowRender,
            deps,
            isNew: true
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