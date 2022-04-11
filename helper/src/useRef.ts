import { useRefValue } from 'better-react'
export function useRef<T>(init: T) {
  return useRefValue(() => init)
}

export function useConstRefValue<T>(init: () => T) {
  return useRefValue(init)()
}

export function useConstRef<T>(init: T) {
  return useRef(init)()
}

export function useAlways<T>(init: T) {
  const ref = useRef(init)
  ref(init)
  return ref
}