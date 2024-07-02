import { alawaysFalse, storeRef } from "wy-helper";
import { hookLevelEffect, useBaseMemo } from "./fc";
import { StateHolder } from "./Fiber";
import { hookAlterStateHolder, hookStateHoder } from "./cache";




function createMapRef() {
  return storeRef(new Map<any, StateHolder>())
}
export function cloneMap<T>(map: Map<any, T>) {
  const newMap = new Map<any, T>()
  map.forEach(function (v, k) {
    newMap.set(k, v)
  })
  return newMap
}
export interface ReduceData<T> {
  readonly value: T
  /**如果是动态生成,可能要自缓存 */
  getNext(): ReduceData<T> | undefined
}

export function renderMapF<T, F>(
  data: ReduceData<T> | undefined,
  getKey: (v: T, i: number) => any,
  reducer: (old: F, value: T, index: number) => F,
  init: F
) {
  const mapRef = useBaseMemo(alawaysFalse, createMapRef, undefined);
  const oldMap = cloneMap(mapRef.get())
  const newMap = new Map<any, StateHolder>()
  const beforeEnv = hookStateHoder()
  let i = 0

  const thisTimeAdd: StateHolder[] = []
  const initData = data
  while (data) {
    const value = data.value
    const key = getKey(value, i)
    let env = oldMap.get(key)
    if (env) {
      env.parentContextIndex.set(beforeEnv.contextProvider.length)
      oldMap.delete(key)
    } else {
      env = StateHolder.from(beforeEnv)
      thisTimeAdd.push(env)
    }
    env.beginRun()
    init = reducer(init, value, i)
    env.endRun()
    newMap.set(key, env)
    data = data.getNext()
    i++
  }
  hookLevelEffect(-3, function () {
    mapRef.set(newMap)
    thisTimeAdd.forEach(env => {
      beforeEnv.children.add(env)
    })
    oldMap.forEach(function (value) {
      beforeEnv.children.delete(value)
    })
  })
  oldMap.forEach(function (value) {
    beforeEnv.envModel.addDelect(value)
  })
  return init
}