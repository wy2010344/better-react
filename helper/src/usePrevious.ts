import { MemoEvent } from "better-react/dist/fc";
import { useMemo } from "./useRef";

/**
 * @todo 
 * 会在并发回滚时出问题
 * 回滚的时候,取的却是之前的赋值
 * @param initBefore 
 * @returns 
 */
// export function getUsePrevious<T>(initBefore?: T) {
//   return function (value: T) {
//     const getBefore = useChgAtom(initBefore)
//     const before = getBefore.get()
//     getBefore.set(value)
//     return before
//   }
// }

// export const usePrevious = getUsePrevious() as <T>(v: T) => T | undefined


export function usePrevious<T>(n: T) {
  return useMemo(previous, n)
}

function previous<T>(n: MemoEvent<T, T>) {
  return n.beforeValue
}