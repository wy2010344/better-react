import { useMemo, storeRef, quote } from 'better-react';

type StoreRef<T> = {
  get(): T
  set(v: T): void
}

/**
 * 如果rollback,不允许改变是持久的
 * 但是ref本质上就是持久的
 * @param init 
 * @returns 
 */

export function useRef<M, T>(init: M, trans: (m: M) => T): StoreRef<T>
export function useRef<T>(init: T): StoreRef<T>
export function useRef() {
  const [init, oldTrans] = arguments
  const trans = oldTrans || quote
  return useMemo(() => storeRef(trans(init)), [])
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

export function useAlways<T>(init: T) {
  const ref = useRef(init)
  ref.set(init)
  return ref.get
}