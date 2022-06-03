import { storeRef, useMemo } from "../core"

export function useRefValue<T>(init: () => T) {
  return useMemo(() => storeRef(init()), [])
}

export function useRef<T>(init: T) {
  return useRefValue(() => init)
}

export function useConstRefValue<T>(init: () => T) {
  return useMemo(init, [])
}

export function useConstRef<T>(init: T) {
  return useConstRefValue(() => init)
}

export function useAlways<T>(init: T) {
  const ref = useRef(init)
  ref.set(init)
  return ref.get
}