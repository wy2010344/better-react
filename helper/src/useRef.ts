import { MemoEvent, hookCreateChangeAtom, useBaseMemo } from 'better-react';
import { storeRef, quote, emptyArray, arrayNotEqualOrOne, GetValue, alawaysTrue } from 'wy-helper'
import { useAttrEffect } from './useEffect';
import { MemoCacheEvent } from 'better-react/dist/fc';

type StoreRef<T> = {
  get(): T
  set(v: T): void
}

export function useMemo<T, V>(
  effect: (e: MemoCacheEvent<V, T>) => T,
  deps: V
): T
export function useMemo<T>(
  effect: (e: MemoCacheEvent<undefined, T>) => T
): T
export function useMemo(
  effect: any,
  deps?: any) {
  return useBaseMemo(arrayNotEqualOrOne, effect, deps)
}
/**
 * 如果rollback,不允许改变是持久的
 * 但是ref本质上就是持久的
 * 返回的是对象
 * @param init 
 * @returns 
 */
export function useAtomBind<M, T>(init: M, trans: (m: M) => T): StoreRef<T>
export function useAtomBind<T>(init: T): StoreRef<T>
export function useAtomBind() {
  const [init, oldTrans] = arguments
  return useMemo(() => {
    const trans = oldTrans || quote
    const ref = storeRef(trans(init))
    ref.get = ref.get.bind(ref)
    ref.set = ref.set.bind(ref)
    return ref
  }, emptyArray)
}
export function useAtomBindFun<T>(init: () => T) {
  return useAtomBind(undefined, init)
}

export function useAtom<M, T>(init: M, trans: (m: M) => T): StoreRef<T>
export function useAtom<T>(init: T): StoreRef<T>
export function useAtom() {
  const [init, oldTrans] = arguments
  return useMemo(() => {
    const trans = oldTrans || quote
    return storeRef(trans(init))
  }, emptyArray)
}
export function useAtomFun<T>(init: () => T) {
  return useAtom(undefined, init)
}

function createLaterGet<T>() {
  const ref = storeRef<T | undefined>(undefined)
  ref.get = ref.get.bind(ref)
  return ref
}

export function useLaterSetGet<T>() {
  return useMemo(createLaterGet, undefined) as StoreRef<T>
}
/**
 * 始终获得render上的最新值
 * 由于useMemoGet的特性,返回的自动就是一个hook上的最新值
 * @param init 
 * @returns 
 */
export function useAlways<T>(init: T) {
  const ref = useLaterSetGet<T>()
  ref.set(init)
  return ref.get as GetValue<T>
}

/**
 * 在AttrEffect里才生效,
 * 会用到吗
 * @param init 
 * @returns 
 */
export function useEventAlaways<T>(init: T) {
  const ref = useAtomBind(init)
  useAttrEffect(() => {
    ref.set(init)
  })
  return ref.get
}

/**
 * 在render中操作会回滚的ref
 * @param init 
 * @param trans 
 */
export function useChgAtom<M, T>(init: M, trans: (m: M) => T): StoreRef<T>
export function useChgAtom<T>(init: T): StoreRef<T>
export function useChgAtom() {
  const [init, oldTrans] = arguments
  const createChangeAtom = hookCreateChangeAtom()
  return useMemo(() => {
    const trans = oldTrans || quote
    return createChangeAtom(trans(init))
  }, emptyArray)
}
export function useChgAtomFun<T>(init: () => T) {
  return useChgAtom(undefined, init)
}


export function useRefConst<T>(fun: () => T) {
  return useAtomFun(fun).get()
}

export function useRefConstWith<T>(v: T) {
  return useAtom(v).get()
}


type MemoReducer<T> = {
  (old: T, isInit: false): T
  (old: undefined, isInit: true): T
}

export function useMemoReducer<T>(fun: MemoReducer<T>, deps: any = fun) {
  if (deps == fun) {
    return useBaseMemo(arrayNotEqualOrOne, memoReducer as any, fun)
  } else {
    return useBaseMemo(arrayNotEqualOrOne, (e) => {
      return (fun as any)(e.beforeValue, e.isInit)
    }, deps)
  }
}
function memoReducer<T>(e: MemoCacheEvent<MemoReducer<T>, T>): T {
  return (e.trigger as any)(e.beforeValue, e.isInit)
}


export function useMemoVersion(...deps: any[]) {
  return useMemo(triggerAdd, deps)
}

function triggerAdd(e: MemoCacheEvent<any, number>) {
  return (e.beforeValue || 0) + 1
}