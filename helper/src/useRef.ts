import { useMemo, storeRef, useEffect } from 'better-react'

/**
 * 如果rollback,不允许改变是持久的
 * 但是ref本质上就是持久的
 * @param init 
 * @returns 
 */
export function useRefValue<T>(init: () => T) {
  return useMemo(() => storeRef(init()), [])
}

export function useRef<T>(init: T) {
  return useRefValue(() => init)
}

export function useConstRefValue<T>(init: () => T) {
  return useRefValue(init).get()
}

export function useConstRef<T>(init: T) {
  return useRef(init).get()
}

export function useAlways<T>(init: T) {
  const ref = useRef(init)
  ref.set(init)
  return ref.get
}