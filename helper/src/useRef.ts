import { MemoEvent, hookCommitAll, hookCreateChangeAtom, useBaseMemoGet } from 'better-react';
import { storeRef, quote, emptyArray, arrayNotEqualOrOne, simpleNotEqual } from 'wy-helper'
import { useAttrEffect } from './useEffect';

type StoreRef<T> = {
  get(): T
  set(v: T): void
}

export function useMemoGet<T, V>(
  effect: (e: MemoEvent<V>) => T,
  deps: V) {
  return useBaseMemoGet(arrayNotEqualOrOne, effect, deps)
}

export function useMemo<T, V>(
  effect: (e: MemoEvent<V>) => T,
  deps: V): T {
  return useMemoGet(effect, deps)()
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

function getDep<T>(e: MemoEvent<T>) {
  return e.trigger
}
/**
 * 始终获得render上的最新值
 * 由于useMemoGet的特性,返回的自动就是一个hook上的最新值
 * @param init 
 * @returns 
 */
export function useAlways<T>(init: T) {
  return useBaseMemoGet(simpleNotEqual, getDep, init)
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

export function useCommitAlaways<T>(init: T) {
  const flushSync = hookCommitAll()
  const getValue = useAlways(init)
  return function () {
    flushSync()
    return getValue()
  }
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
