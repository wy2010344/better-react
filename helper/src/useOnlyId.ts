import { useConstRefValue, useRefValue } from "./useRef"



let id = 0
export function useOnlyId(prefix?: string) {
  const ref = useConstRefValue(() => id++)
  return {
    state: ref,
    id: (prefix || "") + ref
  }
}
