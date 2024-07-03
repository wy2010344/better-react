import { EmptyFun, alawaysFalse, storeRef } from "wy-helper";
import { useBaseMemo } from "./memo";
import { StateHolder } from "./stateHolder";
import { hookStateHoder } from "./cache";
import { hookLevelEffect } from './effect'




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
/**
 * 因为是同步的,且js有副作用,在运行时自己去累计,不过度设计
 * @param forEach 
 * @param render 
 */
export function renderForEach(
  forEach: (callback: (key: any, callback: EmptyFun) => void) => void
) {
  const mapRef = useBaseMemo(alawaysFalse, createMapRef, undefined);
  const oldMap = cloneMap(mapRef.get())
  const newMap = new Map<any, StateHolder>()
  const beforeEnv = hookStateHoder()
  const thisTimeAdd: StateHolder[] = []
  forEach((key, callback) => {
    let env = oldMap.get(key)
    if (env) {
      env.parentContextIndex.set(beforeEnv.contextIndex)
      oldMap.delete(key)
    } else {
      env = StateHolder.from(beforeEnv)
      thisTimeAdd.push(env)
    }
    env.beginRun()
    callback()
    env.endRun()
    newMap.set(key, env)
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