import { StoreRef, emptyArray, storeRef } from "wy-helper";
import { useMemo } from "./useRef";
import { hookCreateChangeAtom } from "better-react";


function increase(ref: StoreRef<number>) {
  const v = ref.get() + 1
  ref.set(v)
  return v
}

export function useVersionInc(init = 0) {
  return useMemo(() => {
    const ref = storeRef(init)
    return function () {
      return increase(ref)
    }
  }, emptyArray)
}
/**
 * 版本锁,同步的
 * @param init 
 * @returns 
 */
export function useVersionLock(init = 0) {
  return useMemo(() => {
    const ref = storeRef(init)
    return [ref.get.bind(ref), function () {
      return increase(ref)
    }] as const
  }, emptyArray)
}

export function useChgVersionLock(init = 0) {
  const createChangeAtom = hookCreateChangeAtom()
  return useMemo(() => {
    const ref = createChangeAtom(init)
    return [ref.get.bind(ref), function () {
      return increase(ref)
    }] as const
  }, emptyArray)
}