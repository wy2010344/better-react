import { useBaseMemoGet, storeRef, quote, emptyArray, useGetCreateChangeAtom } from 'better-react';

type StoreRef<T> = {
  get(): T
  set(v: T): void
}

export function useMemoGet<T, V extends readonly any[] = readonly any[]>(effect: (deps: V) => T, deps: V) {
  return useBaseMemoGet(effect, deps)
}

export function useMemo<T, V extends readonly any[] = readonly any[]>(effect: (deps: V) => T, deps: V): T {
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

function getDep<T>(dep: readonly [T]) {
  return dep[0]
}
/**
 * 始终获得render上的最新值
 * @param init 
 * @returns 
 */
export function useAlways<T>(init: T) {
  return useMemoGet(getDep, [init] as const)
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
  const createChangeAtom = useGetCreateChangeAtom()
  return useMemo(() => {
    const trans = oldTrans || quote
    return createChangeAtom(trans(init))
  }, emptyArray)
}
export function useChgAtomFun<T>(init: () => T) {
  return useChgAtom(undefined, init)
}