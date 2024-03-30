import { useLevelEffect } from "better-react";
import { EffectResult } from "better-react";
import { EffectEvent } from "better-react";
import { arrayNotEqualDepsWithEmpty, simpleNotEqual } from "wy-helper";

export function buildUseEffect(level: number) {
  function useEffect<T extends readonly any[]>(effect: (e: EffectEvent<T>) => EffectResult<T>, deps: T): void
  function useEffect(effect: () => EffectResult<any[]>, deps?: readonly any[]): void
  function useEffect(effect: any) {
    return useLevelEffect(level, arrayNotEqualDepsWithEmpty, effect, arguments[1])
  }
  return useEffect
}

export const useBeforeAttrEffect = buildUseEffect(-1)
export const useAttrEffect = buildUseEffect(0)
export const useEffect = buildUseEffect(1)


export function buildUseOneEffect(level: number) {
  function useEffect<T>(effect: (e: EffectEvent<T>) => EffectResult<T>, deps: T) {
    return useLevelEffect(level, simpleNotEqual, effect, deps)
  }
  return useEffect
}


export const useOneBeforeAttrEffect = buildUseOneEffect(-1)
export const useOneAttrEffect = buildUseOneEffect(0)
export const useOneEffect = buildUseOneEffect(1)
