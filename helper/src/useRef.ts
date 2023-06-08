import { useMemoGet, storeRef, quote } from 'better-react';

type StoreRef<T> = {
  get(): T
  set(v: T): void
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
export function useRef<M, T>(init: M, trans: (m: M) => T): StoreRef<T>
export function useRef<T>(init: T): StoreRef<T>
export function useRef() {
  const [init, oldTrans] = arguments
  const trans = oldTrans || quote
  return useMemo(() => {
    const ref = storeRef(trans(init))
    ref.get = ref.get.bind(ref)
    ref.set = ref.set.bind(ref)
    return ref
  }, [])
}
export function useRefFun<T>(init: () => T) {
  return useRef(undefined, init)
}
export function useConstRef<M, T>(init: M, trans: (m: M) => T): T
export function useConstRef<T>(init: T): T
export function useConstRef() {
  const [init, trans] = arguments
  return useRef(init, trans).get()
}
export function useConstRefFun<T>(init: () => T) {
  return useRef(undefined, init).get()
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