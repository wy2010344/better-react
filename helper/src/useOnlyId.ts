import { EMPTYCONSTARRAY } from "better-react"
import { useMemo } from "./useRef"



let id = 0
/**
 * 会随deps增加
 * @param deps 
 * @returns 
 */
export function useOnlyId(deps?: readonly any[]) {
  return useMemo(getOnlyId, deps || EMPTYCONSTARRAY)
}
export function getOnlyId() {
  return id++
}