import { useLevelEffect } from "better-react";
import { EffectResult } from "better-react";

export function buildUseEffect(level: number) {
  function useEffect<T>(effect: (args: T) => EffectResult<T>, deps: T): void
  function useEffect(effect: () => EffectResult<any[]>, deps?: readonly any[]): void
  function useEffect(effect: any) {
    return useLevelEffect(level, effect, arguments[1])
  }
  return useEffect
}

export const useAttrEffect = buildUseEffect(0)
export const useEffect = buildUseEffect(1)