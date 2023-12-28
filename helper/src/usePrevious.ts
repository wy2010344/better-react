import { useChgAtom } from "./useRef";

/**
 * @todo 
 * 会在并发回滚时出问题
 * @param initBefore 
 * @returns 
 */
export function getUsePrevious<T>(initBefore?: T) {
  return function (value: T) {
    const getBefore = useChgAtom(initBefore)
    const before = getBefore.get()
    getBefore.set(value)
    return before
  }
}

export const usePrevious = getUsePrevious() as <T>(v: T) => T | undefined