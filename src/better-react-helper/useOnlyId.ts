import { useRefValue } from "better-react"



let id = 0
export function useOnlyId(prefix?: string) {
  const ref = useRefValue(() => id++)
  return {
    state: ref(),
    id: (prefix || "") + ref()
  }
}
