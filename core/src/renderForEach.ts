import { EmptyFun, alawaysFalse, storeRef } from "wy-helper";
import { useBaseMemo } from "./memo";
import { StateHolder } from "./stateHolder";
import { hookStateHoder } from "./cache";
import { hookLevelEffect } from './effect'




function createMapRef() {
  return storeRef(new Map<any, StateHolder[]>())
}
export function cloneMap<T>(map: Map<any, T[]>) {
  const newMap = new Map<any, T[]>()
  map.forEach(function (v, k) {
    newMap.set(k, v.slice())
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
  const newMap = new Map<any, StateHolder[]>()
  const beforeEnv = hookStateHoder()
  const thisTimeAdd: StateHolder[] = []
  forEach((key, callback) => {
    let envs = oldMap.get(key)
    let env: StateHolder
    if (envs?.length) {
      env = envs.shift()!
      env.parentContextIndex.set(beforeEnv.contextIndex)
    } else {
      env = StateHolder.from(beforeEnv)
      thisTimeAdd.push(env)
    }
    env.beginRun()
    callback()
    env.endRun()
    let newEnvs = newMap.get(key)
    if (newEnvs) {
      newEnvs.push(env)
      console.warn(`重复的key[${key}]出现第${newEnvs.length}次`)
    } else {
      newEnvs = [env]
    }
    newMap.set(key, newEnvs)
  })

  oldMap.forEach(function (values) {
    values.forEach(value => {
      beforeEnv.envModel.addDelect(value)
    })
  })
  hookLevelEffect(0, function () {
    mapRef.set(newMap)
    beforeEnv.children = beforeEnv.children || new Set()
    const children = beforeEnv.children
    thisTimeAdd.forEach(env => {
      children.add(env)
    })
    oldMap.forEach(function (values) {
      values.forEach(value => {
        children.delete(value)
      })
    })
  })
}