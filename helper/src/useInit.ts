import { emptyArray } from "better-react";
import { useEvent } from "./useEvent";
import { useEffect } from "./useEffect";

export function useInit(callback: (dep: readonly any[]) => (void | (() => void))) {
  useEffect(callback, emptyArray)
}

export function useDestroy(initCallback: () => void) {
  const callback = useEvent(initCallback)
  useEffect(() => callback, emptyArray)
}