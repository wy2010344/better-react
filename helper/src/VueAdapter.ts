
import { useAtomBindFun, useMemo } from "./useRef";
import { Compare, emptyArray, EmptyFun, GetValue, SetValue, simpleNotEqual } from "wy-helper";
import { useDestroy } from "./useInit";
import { cacheOf, createVueInstance, valueOf, watch, watchAfter, watchBefore, watchExp } from 'wy-helper/Vue'
import { createContext } from "better-react";

export function useRefVueValueFrom<T>(init: () => T, shouldChange?: Compare<any>) {
  return useAtomBindFun(() => valueOf(init(), shouldChange)).get()
}
export function useRefVueValue<T>(init: T, shouldChange?: Compare<any>) {
  return useRefVueValueFrom(() => init, shouldChange)
}

export function useRefAtomVueValueFrom<T>(init: () => T, shouldChange: Compare<any> = simpleNotEqual) {
  return useAtomBindFun(() => valueOf(init(), shouldChange)).get()
}
export function useRefAtomVueValue<T>(init: T, shouldChange: Compare<any> = simpleNotEqual) {
  return useRefVueValueFrom(() => init, shouldChange)
}


export const VueContext = createContext<SetValue<EmptyFun>>(null as any)

export function useWatch(exp: EmptyFun) {
  const inst = VueContext.useConsumer()
  const destroy = useMemo(() => {
    return watch(inst, exp)
  }, emptyArray)
  useDestroy(destroy)
}

export function useWatchExp<A, B>(
  before: () => A,
  exp: (a: A) => B,
  after: (b: B) => void
) {
  const inst = VueContext.useConsumer()
  const destroy = useMemo(() => {
    return watchExp(inst, before, exp, after)
  }, emptyArray)
  useDestroy(destroy)
}

export function useWatchBefore<A, B>(
  before: () => A,
  exp: (a: A) => void,
) {
  const inst = VueContext.useConsumer()
  const destroy = useMemo(() => {
    return watchBefore(inst, before, exp)
  }, emptyArray)
  useDestroy(destroy)
}

export function useWatchAfter<A, B>(
  exp: () => B,
  after: (b: B) => void
) {
  const inst = VueContext.useConsumer()
  const destroy = useMemo(() => {
    return watchAfter(inst, exp, after)
  }, emptyArray)
  useDestroy(destroy)
}
export function useCache<T>(exp: GetValue<T>, shouldChange?: Compare<any>) {
  const inst = VueContext.useConsumer()
  const [get, destroy] = useMemo(() => cacheOf(inst, exp, shouldChange), emptyArray)
  useDestroy(destroy)
  return get
}

export function useAtomCache<T>(exp: GetValue<T>, shouldChange: Compare<any> = simpleNotEqual) {
  return useCache(exp, shouldChange)
}

