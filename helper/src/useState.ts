import { useValue } from 'better-react'

export function useStateFrom<T>(init: () => T) {
  const hook = useValue(init)
  return [hook(), hook] as const
}
export function useState<T>(initial: T) {
  return useStateFrom(() => initial)
}