import { EffectDestroy, EffectDestroyEvent, useLevelEffect } from "better-react";
import { EffectEvent } from "better-react";
import { hookLevelEffect } from "better-react";
import { EmptyFun, FalseType, arrayFunToOneOrEmpty, arrayNotEqualOrOne } from "wy-helper";
function useBaseEffect<T>(
  level: number,
  shouldChange: (a: T, b: T) => any,
  effect: (e: EffectEvent<undefined, T>) => EffectDestroy<undefined, T>,
  deps: T): void {
  useLevelEffect<undefined, T>(level, shouldChange, e => {
    return [undefined, effect(e)]
  }, deps)
}

type EffectSelf = (e: EffectEvent<undefined, EffectSelf>) => EffectDestroy<undefined, EffectSelf>
export function buildUseEffect(level: number) {
  function useEffect<T>(effect: (e: EffectEvent<undefined, T>) => EffectDestroy<undefined, T>, deps: T): void
  function useEffect(effect: EffectSelf): void
  function useEffect(effect: any) {
    const deps = arguments.length == 1 ? effect : arguments[1]
    return useBaseEffect(level, arrayNotEqualOrOne, effect, deps)
  }
  return useEffect
}

export const useBeforeAttrEffect = buildUseEffect(-1)
export const useAttrEffect = buildUseEffect(0)
export const useEffect = buildUseEffect(1)

/*** */
export function buildHookEffect(level: number) {
  return function (effect: EmptyFun) {
    return hookLevelEffect(level, effect)
  }
}

export const hookBeforeAttrEffect = buildHookEffect(-1)
export const hookAttrEffect = buildHookEffect(0)
export const hookEffect = buildHookEffect(1)




let globalVS: ((e: any) => void)[] | FalseType = undefined
function useBaseHookEffect<V, T>(level: number, shouldChange: (a: T, b: T) => any, effect: (e: EffectEvent<V, T>) => V, deps: T): void {
  useLevelEffect<V, T>(level, shouldChange, e => {
    const vs: ((e: EffectDestroyEvent<V, T>) => void)[] = []
    globalVS = vs
    const value = effect(e)
    globalVS = undefined
    return [value, arrayFunToOneOrEmpty(vs)]
  }, deps)
}
export function addEffectDestroy<V, T>(fun: (e: EffectDestroyEvent<V, T>) => void) {
  if (globalVS) {
    globalVS.push(fun)
  } else {
    throw new Error("必须在effect里执行")
  }
}
type EffectHookSelf<V> = (e: EffectEvent<V, EffectHookSelf<V>>) => V

export function buildUseHookEffect(level: number) {
  function useEffect<V, T>(effect: (e: EffectEvent<V, T>) => V, deps: T): void
  function useEffect<V>(effect: EffectHookSelf<V>): void
  function useEffect(effect: any) {
    const deps = arguments.length == 1 ? effect : arguments[1]
    useBaseHookEffect(level, arrayNotEqualOrOne, effect, deps)
  }
  return useEffect
}

export const useBeforeAttrHookEffect = buildUseHookEffect(-1)
export const useAttrHookEffect = buildUseHookEffect(0)
export const useHookEffect = buildUseHookEffect(1)