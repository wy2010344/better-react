import { useState } from 'better-react'
import { useRef } from './useRef'
export function useRefState<T>(init: T | (() => T), afterSet?: () => void) {
  const [value, setValue] = useState(init)
  const ref = useRef(value)
  return [value, function (v: T) {
    setValue(v)
    ref.set(v)
    afterSet?.()
  }, ref.get] as const
}