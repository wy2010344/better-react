import { useConstRefValue, useRefValue } from "./useRef"



let id = 0
export function useOnlyId(prefix?: string) {
  const ref = useConstRefValue(() => id++)
  return {
    state: ref,
    id: (prefix || "") + ref
  }
}
export function getOnlyId(prefix?: string) {
  const state = id++
  return {
    state,
    id: (prefix || "") + state
  }
}