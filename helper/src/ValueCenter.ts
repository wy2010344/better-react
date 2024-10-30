import { ReadValueCenter, SyncFun, ValueCenter, emptyArray, quote, valueCenterOf } from "wy-helper"
import { useConstDep, useMemo } from "./useRef"

export function useValueCenter<T>(init: T): ValueCenter<T>
export function useValueCenter<T, M>(init: M, trans: (v: M) => T): ValueCenter<T>
export function useValueCenter<T = undefined>(): ValueCenter<T | undefined>
export function useValueCenter() {
  const [init, initTrans] = arguments
  return useMemo(() => {
    const trans = initTrans || quote
    return valueCenterOf(trans(init))
  }, emptyArray)
}
export function useValueCenterFun<T>(fun: () => T): ValueCenter<T> {
  return useValueCenter(undefined, fun)
}
export function useSyncCenterDep<T>(v: ReadValueCenter<T>, dep?: any) {
  return useConstDep<SyncFun<T>>(function () {
    const [set, a, b, c] = arguments
    set(v.get(), a, b, c)
    return v.subscribe(n => {
      set(n, a, b, c)
    })
  }, dep)
}
export function useSyncCenter<T>(v: ReadValueCenter<T>) {
  return useSyncCenterDep(v, emptyArray)
}