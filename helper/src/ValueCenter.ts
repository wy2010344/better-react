import { HookValueSet, emptyFun, quote } from "better-react"
import { useMemo } from "./useRef"

type EventHandler<T> = (v: T) => void
export interface VirtualEventCenter<T> {
  subscribe(notify: EventHandler<T>): () => void
}
export type Subscriber<T> = (v: EventHandler<T>) => (() => void)
export function eventCenter<T>() {
  const pool = new Set<EventHandler<T>>()
  return {
    poolSize() {
      return pool.size
    },
    subscribe(notify: EventHandler<T>) {
      if (pool.has(notify)) {
        return emptyFun
      }
      pool.add(notify)
      return function () {
        pool.delete(notify)
      }
    },
    notify(v: T) {
      pool.forEach(notify => notify(v))
    }
  }
}
export function toReduceState<T>(set: (v: T) => void, get: () => T,) {
  return function (v: T | ((prev: T) => T)) {
    if (typeof (v) == 'function') {
      set((v as any)(get()))
    } else {
      set(v)
    }
  }
}
export type SetStateAction<T> = T | ((v: T) => T)
export type ReduceState<T> = HookValueSet<SetStateAction<T>>
export interface ValueCenter<T> {
  get(): T
  set(v: T): void
  poolSize(): number
  subscribe: Subscriber<T>
}
export function valueCenterOf<T>(value: T): ValueCenter<T> {
  const { subscribe, notify, poolSize } = eventCenter<T>()
  return {
    get() {
      return value
    },
    poolSize,
    set(v) {
      value = v
      notify(v)
    },
    subscribe
  }
}
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
