import { React } from "../better-react-dom/tsxSupport"
import { useRefValue, useEffect, useValue } from 'better-react'

export function UseEffect({
  effect,
  deps
}: {
  effect: React.EffectCallback,
  deps?: React.DependencyList
}) {
  useEffect(effect, deps)
  return <></>
}
