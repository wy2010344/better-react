import { emptyArray } from "wy-helper";
import { useCallback } from "./useCallback";
import { useAlways, useMemo } from "./useRef";

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

export function useProxy<T extends object>(init: T) {
  const get = useAlways(init)
  return useMemo(() => {
    return new Proxy<T>(get(), {
      get(target, p, receiver) {
        return (get() as any)[p]
      },
      apply(target, thisArg, argArray) {
        return (get() as any).apply(thisArg, argArray)
      },
      construct(target, argArray, newTarget) {
        return new (get() as any)(...argArray)
      },
    })
  }, emptyArray)
}