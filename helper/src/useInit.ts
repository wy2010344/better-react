import { emptyArray, useEffect } from "better-react";
import { useEvent } from "./useEvent";

export function useInit(callback: (dep: readonly any[]) => (void | (() => void))) {
  useEffect(callback, emptyArray)
}

export function useDestroy(initCallback: () => void) {
  const callback = useEvent(initCallback)
  useEffect(() => callback, emptyArray)
}