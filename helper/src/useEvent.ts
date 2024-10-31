import { emptyArray } from "wy-helper";
import { useAlaways, useConst, useMemo, useRef } from "./useRef";
import { hookCommitAll, hookLevelEffect } from "better-react";
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

export function useEvent<T extends (...vs: any[]) => any>(fun: T): T {
  const ref = useRef(fun)
  /**
   * 不在memo阶段,因为有fiber,可能访问到未render的数据
   * 而在effect阶段,所有数据都计算完毕
   */
  hookLevelEffect(-Infinity, () => {
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