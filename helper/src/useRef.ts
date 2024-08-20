import { MemoEvent, hookCreateChangeAtom, useBaseMemo } from 'better-react';
import { storeRef, quote, emptyArray, arrayNotEqualOrOne, GetValue } from 'wy-helper'
import { useAttrEffect } from './useEffect';
type StoreRef<T> = {
  get(): T
  set(v: T): void
}
type MemoEffectSelf<T> = (e: MemoEvent<T, MemoEffectSelf<T>>) => T
export function useMemo<V, D>(
  effect: (e: MemoEvent<V, D>) => V,
  deps: D
): V
export function useMemo<T>(
  effect: (e: MemoEffectSelf<T>) => T
): T
export function useMemo(
  effect: any) {
  const dep = arguments.length == 1 ? effect : arguments[1]
  return useBaseMemo(arrayNotEqualOrOne, effect, dep)
}

export function useConst<F, Arg extends readonly any[] = readonly any[]>(creater: (...vs: Arg) => F, ...vs: Arg) {
  return useMemo(e => {
    return creater(...vs)
  }, emptyArray) as F
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


function createRef<T>(v: T) {
  return {
    current: v
  }
}

export function useRef<T>(init: T) {
  return useConst(createRef, init)
}

function createLaterGet<T>() {
  const ref = storeRef<T | undefined>(undefined)
  ref.get = ref.get.bind(ref)
  return ref
}

export function useLaterSetGet<T>() {
  return useMemo(createLaterGet, emptyArray) as StoreRef<T>
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

export function useRefConstWith<T>(v: T) {
  return useAtom(v).get()
}

export function useMemoVersion(...deps: any[]) {
  return useMemo(triggerAdd, deps)
}

function triggerAdd(e: MemoEvent<number, any>) {
  return (e.beforeValue || 0) + 1
}