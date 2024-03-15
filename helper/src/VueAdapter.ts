import { cacheOf, notEqualChange, ShouldChange, valueOf, watch, watchAfter, watchBefore, watchExp } from "wy-helper/Vue";
import { useAtomBindFun, useMemo } from "./useRef";
import { emptyArray, EmptyFun, GetValue } from "wy-helper";
import { useDestroy } from "./useInit";


export function useRefVueValueFrom<T>(init: () => T, shouldChange?: ShouldChange<any>) {
  return useAtomBindFun(() => valueOf(init(), shouldChange)).get()
}
export function useRefVueValue<T>(init: T, shouldChange?: ShouldChange<any>) {
  return useRefVueValueFrom(() => init, shouldChange)
}

export function useRefAtomVueValueFrom<T>(init: () => T, shouldChange: ShouldChange<any> = notEqualChange) {
  return useAtomBindFun(() => valueOf(init(), shouldChange)).get()
}
export function useRefAtomVueValue<T>(init: T, shouldChange: ShouldChange<any> = notEqualChange) {
  return useRefVueValueFrom(() => init, shouldChange)
}


export function useWatch(exp: EmptyFun) {
  const destroy = useMemo(() => {
    return watch(exp)
  }, emptyArray)
  useDestroy(destroy)
}

export function useWatchExp<A, B>(
  before: () => A,
  exp: (a: A) => B,
  after: (b: B) => void
) {
  const destroy = useMemo(() => {
    return watchExp(before, exp, after)
  }, emptyArray)
  useDestroy(destroy)
}

export function useWatchBefore<A, B>(
  before: () => A,
  exp: (a: A) => void,
) {
  const destroy = useMemo(() => {
    return watchBefore(before, exp)
  }, emptyArray)
  useDestroy(destroy)
}

export function useWatchAfter<A, B>(
  exp: () => B,
  after: (b: B) => void
) {
  const destroy = useMemo(() => {
    return watchAfter(exp, after)
  }, emptyArray)
  useDestroy(destroy)
}
export function useCache<T>(exp: GetValue<T>, shouldChange?: ShouldChange<any>) {
  const [get, destroy] = useMemo(() => cacheOf(exp, shouldChange), emptyArray)
  useDestroy(destroy)
  return get
}

export function useAtomCache<T>(exp: GetValue<T>, shouldChange: ShouldChange<any> = notEqualChange) {
  return useCache(exp, shouldChange)
}

