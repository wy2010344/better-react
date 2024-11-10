import { EmptyFun, StoreRef, alawaysFalse, storeRef } from "wy-helper";
import { MemoEvent, useBaseMemo } from "./memo";
import { StateHolder } from "./stateHolder";
import { hookStateHoder } from "./cache";


export interface RMap<K, V> {
  get(key: K): V | undefined
  set(key: K, value: V): void
  forEach(fun: (value: V, key: K) => void): void
}

export interface RMapCreater<K, V> {
  (): RMap<K, V>
}
function createMapRef(e: MemoEvent<
  StoreRef<RMap<any, StateHolder[]>>,
  RMapCreater<any, StateHolder[]>
>) {
  return storeRef(e.trigger())
}

export function normalMapCreater<K, V>() {
  return new Map<K, V>()
}

export function cloneMap<K, T>(
  map: RMap<K, T[]>,
  creater: RMapCreater<K, T[]>
) {
  const newMap = creater()
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
export function renderForEach<K>(
  forEach: (callback: (key: K, callback: EmptyFun) => void) => void,
  createMap: RMapCreater<K, StateHolder[]> = normalMapCreater
) {
  const mapRef = useBaseMemo(alawaysFalse, createMapRef, createMap);
  const oldMap = cloneMap(mapRef.get(), createMap)
  const newMap = createMap()
  const beforeEnv = hookStateHoder()
  const envModel = beforeEnv.envModel
  const thisTimeAdd: StateHolder[] = []
  forEach((key, callback) => {
    let envs = oldMap.get(key)
    let env: StateHolder
    if (envs?.length) {
      env = envs.shift()!
      if (env.parentContextIndex != beforeEnv.contextIndex) {
        throw 'parentContext位置改变!!'
      }
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
      envModel.addDelect(value)
    })
  })
  envModel.updateEffect(0, function () {
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