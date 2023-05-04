import { useRef } from "./useRef";

export function getUsePrevious<T>(initBefore?: T) {
  return function (value: T) {
    const getBefore = useRef(initBefore)
    const before = getBefore.get()
    getBefore.set(value)
    return before
  }
}

export const usePrevious = getUsePrevious() as <T>(v: T) => T | undefined