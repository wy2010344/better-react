import { useConstRefValue } from "./useRef"



let id = 0
export function useOnlyId() {
  return useConstRefValue(getOnlyId)
}
export function getOnlyId() {
  return id++
}