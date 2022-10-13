import { useEffect, useMemo, useState } from "better-react"
import { useRefValue } from "./useRef"

type EventHandler<T> = (v: T) => void
export interface VirtualEventCenter<T> {
  subscribe(notify: EventHandler<T>): () => void
}
type Subscriber<T> = (v: EventHandler<T>) => (() => void)
const emptyFun = () => { }
export function eventCenter<T>() {
  const pool = new Set<EventHandler<T>>()
  return {
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
export type ReduceState<T> = (v: T | ((v: T) => T)) => void
export interface ValueCenter<T> {
  get(): T
  set: ReduceState<T>
  subscribe: Subscriber<T>
}
export function valueCenterOf<T>(value: T): ValueCenter<T> {
  const { subscribe, notify } = eventCenter<T>()
  function get() {
    return value
  }
  const set = toReduceState(v => {
    value = v
    notify(v)
  }, get)
  return {
    get, set,
    subscribe
  }
}
export function useValueCenter<T>(init: () => T): ValueCenter<T> {
  return useMemo(() => {
    return valueCenterOf(init())
  }, [])
}
export function useValueCenterWith<T>(): ValueCenter<T | undefined>
export function useValueCenterWith<T>(v: T): ValueCenter<T>
export function useValueCenterWith() {
  const v = arguments[0]
  return useValueCenter(() => v)
}