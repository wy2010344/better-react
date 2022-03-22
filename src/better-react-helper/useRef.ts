import { useRefValue } from 'better-react'
export function useRef<T>(init: T) {
  return useRefValue(() => init)
}
