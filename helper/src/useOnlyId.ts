import { useConstRefFun } from "./useRef"



let id = 0
export function useOnlyId() {
  return useConstRefFun(getOnlyId)
}
export function getOnlyId() {
  return id++
}