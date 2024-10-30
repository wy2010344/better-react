import { emptyArray } from "wy-helper";
import { useAlaways, useConst, useMemo, useRef } from "./useRef";
import { hookCommitAll } from "better-react";
import { useAttrEffect } from "./useEffect";

export function useCommitAlaways<T>(init: T) {
  const flushSync = hookCommitAll()
  const getValue = useAlaways(init)
  return function () {
    flushSync()
    return getValue()
  }
}


function useBuildGet<T extends (...vs: any[]) => any>(object: {
  current: T
}) {
  return useConst<T>(function (...vs) {
    return object.current(...vs)
  } as T)
}
/**
 * 
 * 只是对应单个函数,如果对应多个函数,就是Map,需要直接useRefConst
 * @param fun 
 * @returns 
 */
export function useEvent<T extends (...vs: any[]) => any>(fun: T): T {
  const ref = useRef(fun)
  ref.current = fun
  return useBuildGet(ref)
}


export function useAttrEvent<T extends (...vs: any[]) => any>(fun: T): T {
  const ref = useRef(fun)
  useAttrEffect(() => {
    ref.current = fun
  })
  return useBuildGet(ref)
}


function useBuildProxy<T extends object>(get: {
  current: T
}) {
  return useMemo(() => {
    return new Proxy<T>(get.current, {
      get(target, p, receiver) {
        return (get.current as any)[p]
      },
      apply(target, thisArg, argArray) {
        return (get.current as any).apply(thisArg, argArray)
      },
      construct(target, argArray, newTarget) {
        return new (get.current as any)(...argArray)
      },
    })
  }, emptyArray)
}
export function useProxy<T extends object>(init: T) {
  const ref = useRef(init)
  ref.current = init
  return useBuildProxy(ref)
}

export function useAttrProxy<T extends object>(init: T) {
  const ref = useRef(init)
  useAttrEffect(() => {
    ref.current = init
  })
  return useBuildProxy(ref)
}