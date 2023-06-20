import { Fiber, VirtaulDomNode, VirtualDomOperator } from "./Fiber"
import { EMPTYCONSTARRAY, draftParentFiber, revertParentFiber, useBaseFiber, useBeforeAttrEffect, useMemoGet, useParentFiber } from "./fc"
import { storeRef } from "./util"

////////****useMap****////////////////////////////////////////////////////////////////////////////////////////////////////////////
export type Translate<M, T> = {
  size(m: M): number
  get(m: M, i: number): T
}
export type MapRowRender<T extends any[]> = readonly [
  any,
  VirtaulDomNode | undefined,
  (v: T) => void,
  T,
] | readonly [
  any,
  VirtaulDomNode | undefined,
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
    const [envModel, parentFiber] = useParentFiber()

    let beforeFiber: Fiber | undefined = undefined
    //提前置空
    parentFiber.firstChild.set(undefined!)
    parentFiber.lastChild.set(undefined!)

    const maxSize = translate.size(data)
    for (let i = 0; i < maxSize; i++) {
      const v = translate.get(data, i)

      draftParentFiber()
      const [key, dom, rowRender, deps,] = render(v, i)
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
          envModel,
          parentFiber,
          dom,
          {
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
        //需要清理,以保证不会删除错误
        old.before.set(undefined)
        old.next.set(undefined)
        envModel.addDelect(old)
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