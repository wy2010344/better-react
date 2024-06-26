import { emptyArray } from "wy-helper"
import { useMemo } from "./useRef"



let id = 0
/**
 * 会随deps增加
 * @param deps 
 * @returns 
 */
export function useOnlyId(deps: any = emptyArray) {
  return useMemo(getOnlyId, deps)
}
export function getOnlyId() {
  return id++
}