import { emptyArray } from "wy-helper"
import { useEvent } from "./useEvent";
import { useEffect } from "./useEffect";
export function useEventDestroy(initCallback: () => void) {
  const callback = useEvent(initCallback)
  useDestroy(callback)
}

export function useDestroy(callback: () => void) {
  useEffect(() => [undefined, callback], emptyArray)
}