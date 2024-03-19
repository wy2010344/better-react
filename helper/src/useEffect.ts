import { useLevelEffect } from "better-react";
import { EffectResult } from "better-react";
import { arrayNotEqualDepsWithEmpty } from "wy-helper";
import { notEqualChange } from "wy-helper/Vue";

export function buildUseEffect(level: number) {
  function useEffect<T extends readonly any[]>(effect: (oldArgs: T | undefined, isInit: boolean, newArgs: T) => EffectResult<T>, deps: T): void
  function useEffect(effect: () => EffectResult<any[]>, deps?: readonly any[]): void
  function useEffect(effect: any) {
    return useLevelEffect(level, arrayNotEqualDepsWithEmpty, effect, arguments[1])
  }
  return useEffect
}

export const useAttrEffect = buildUseEffect(0)
export const useEffect = buildUseEffect(1)


export function buildUseOneEffect(level: number) {
  function useEffect<T>(effect: (oldArgs: T | undefined, isInit: boolean, newArgs: T) => EffectResult<T>, deps: T) {
    return useLevelEffect(level, notEqualChange, effect, deps)
  }
  return useEffect
}


export const useOneAttrEffect = buildUseOneEffect(0)
export const useOneEffect = buildUseOneEffect(1)
