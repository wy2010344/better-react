import { useConstRefValue, useRefValue } from "./useRef"



let id = 0
export function useOnlyId(prefix?: string) {
  return useConstRefValue(() => id++)
}
export function getOnlyId() {
  return id++
}