import { useCallback } from "./useCallback";
import { useAlways } from "./useRef";

/**
 * 
 * 只是对应单个函数,如果对应多个函数,就是Map,需要直接useRefConst
 * @param fun 
 * @returns 
 */
export function useEvent<T extends (...vs: any[]) => any>(fun: T): T {
  const get = useAlways(fun)
  return useCallback<T>(function (...vs) {
    return get()(...vs)
  } as T, [])
}