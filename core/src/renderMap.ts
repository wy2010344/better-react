import { alawaysFalse, storeRef } from "wy-helper";
import { hookLevelEffect, useBaseMemo } from "./fc";
import { StateHolder } from "./Fiber";
import { hookStateHoder } from "./cache";




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
export function renderMapF<T, V = any>(
  forEach: (callback: (init: V, row: T, key: any) => V) => void,
  render: (init: V, row: T, i: number) => V
) {
  const mapRef = useBaseMemo(alawaysFalse, createMapRef, undefined);
  const oldMap = cloneMap(mapRef.get())
  const newMap = new Map<any, StateHolder>()
  const beforeEnv = hookStateHoder()
  const thisTimeAdd: StateHolder[] = []
  let i = 0
  forEach((init, value, key) => {
    let env = oldMap.get(key)
    if (env) {
      env.parentContextIndex.set(beforeEnv.contextIndex)
      oldMap.delete(key)
    } else {
      env = StateHolder.from(beforeEnv)
      thisTimeAdd.push(env)
    }
    env.beginRun()
    const v = render(init, value, i)
    env.endRun()
    newMap.set(key, env)
    i++
    return v
  })
  hookLevelEffect(0, function () {
    mapRef.set(newMap)
    beforeEnv.children = beforeEnv.children || new Set()
    const children = beforeEnv.children
    thisTimeAdd.forEach(env => {
      children.add(env)
    })
    oldMap.forEach(function (value) {
      children.delete(value)
    })
  })
  oldMap.forEach(function (value) {
    beforeEnv.envModel.addDelect(value)
  })
}