import { useRef } from "react"

let id = 0
export function useOnlyId(prefix?: string) {
  const ref = useRef(-1)
  if (ref.current < 0) {
    ref.current = id++
  }
  return {
    state: ref.current,
    id: (prefix || "") + ref.current
  }
}
