import { EffectDestroy, EffectDestroyEvent, useLevelEffect } from "better-react";
import { EffectEvent } from "better-react";
import { hookLevelEffect } from "better-react";
import { EmptyFun, FalseType, arrayFunToOneOrEmpty, arrayNotEqualDepsWithEmpty, simpleNotEqual } from "wy-helper";
function useBaseEffect<T>(level: number, shouldChange: (a: T, b: T) => any, effect: (e: EffectEvent<FalseType, T>) => EffectDestroy<FalseType, T>, deps: T): void {
  useLevelEffect<FalseType, T>(level, shouldChange, e => {
    return [undefined, effect(e)]
  }, deps)
}
export function buildUseEffect(level: number) {
  function useEffect<V = FalseType, T extends readonly any[] = readonly any[]>(effect: (e: EffectEvent<V, T>) => EffectDestroy<V, T>, deps: T): void
  function useEffect<V = FalseType>(effect: (e: EffectEvent<V, readonly any[]>) => EffectDestroy<V, any[]>, deps?: readonly any[]): void
  function useEffect(effect: any) {
    return useBaseEffect(level, arrayNotEqualDepsWithEmpty, effect, arguments[1])
  }
  return useEffect
}

export const useBeforeAttrEffect = buildUseEffect(-1)
export const useAttrEffect = buildUseEffect(0)
export const useEffect = buildUseEffect(1)


export function buildUseOneEffect(level: number) {
  function useEffect<T>(effect: (e: EffectEvent<FalseType, T>) => EffectDestroy<FalseType, T>, deps: T) {
    return useBaseEffect(level, simpleNotEqual, effect, deps)
  }
  return useEffect
}


export const useOneBeforeAttrEffect = buildUseOneEffect(-1)
export const useOneAttrEffect = buildUseOneEffect(0)
export const useOneEffect = buildUseOneEffect(1)



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

export function buildUseHookEffect(level: number) {
  function useEffect<V = FalseType, T extends readonly any[] = readonly any[]>(effect: (e: EffectEvent<V, T>) => V, deps: T): void
  function useEffect<V = FalseType>(effect: (e: EffectEvent<V, readonly any[]>) => V, deps?: readonly any[]): void
  function useEffect(effect: any) {
    useBaseHookEffect(level, arrayNotEqualDepsWithEmpty, effect, arguments[1])
  }
  return useEffect
}

export const useBeforeAttrHookEffect = buildUseHookEffect(-1)
export const useAttrHookEffect = buildUseHookEffect(0)
export const useHookEffect = buildUseHookEffect(1)


export function buildUseOneHookEffect(level: number) {
  function useEffect<T, V = FalseType>(effect: (e: EffectEvent<V, T>) => V, deps: T) {
    useBaseHookEffect(level, simpleNotEqual, effect, deps)
  }
  return useEffect
}


export const useOneBeforeAttrHookEffect = buildUseOneHookEffect(-1)
export const useOneAttrHookEffect = buildUseOneHookEffect(0)
export const useOneHookEffect = buildUseOneHookEffect(1)
