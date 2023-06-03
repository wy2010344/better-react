import { useEffect } from "better-react";
import { useEvent } from "./useEvent";

const EMPTYDEPS: any[] = []
export function useInit(callback: () => (void | (() => void))) {
  useEffect(callback, EMPTYDEPS)
}

export function useDestroy(initCallback: () => void) {
  const callback = useEvent(initCallback)
  useEffect(() => callback, EMPTYDEPS)
}