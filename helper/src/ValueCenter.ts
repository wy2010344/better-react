import { ValueCenter, quote, valueCenterOf } from "wy-helper"
import { useMemo } from "./useRef"

export function useValueCenter<T>(init: T): ValueCenter<T>
export function useValueCenter<T, M>(init: M, trans: (v: M) => T): ValueCenter<T>
export function useValueCenter<T = undefined>(): ValueCenter<T | undefined>
export function useValueCenter() {
  const [init, initTrans] = arguments
  return useMemo(() => {
    const trans = initTrans || quote
    return valueCenterOf(trans(init))
  }, [])
}
export function useValueCenterFun<T>(fun: () => T): ValueCenter<T> {
  return useValueCenter(undefined, fun)
}
