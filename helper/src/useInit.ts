import { EmptyFun, emptyArray } from "wy-helper"
import { useEvent } from "./useEvent";
import { useEffect } from "./useEffect";
export function useEventDestroy(initCallback: () => void) {
  const callback = useEvent(initCallback)
  useDestroy(callback)
}

export function useDestroy(callback: () => void) {
  useEffect(() => callback, emptyArray)
}

export function useInit(callback: EmptyFun) {
  useEffect(callback, emptyArray)
}