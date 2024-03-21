import { emptyArray } from "wy-helper"
import { useEvent } from "./useEvent";
import { useEffect, useOneEffect } from "./useEffect";
import { EffectEvent } from "better-react";

export function useInit(callback: (e: EffectEvent<undefined>) => (void | (() => void))) {
  useOneEffect(callback, undefined)
}

export function useEventDestroy(initCallback: () => void) {
  const callback = useEvent(initCallback)
  useDestroy(callback)
}

export function useDestroy(callback: () => void) {
  useEffect(() => callback, emptyArray)
}