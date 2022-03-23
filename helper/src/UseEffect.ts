import { useEffect } from 'better-react'
declare const UNDEFINED_VOID_ONLY: unique symbol;
type Destructor = () => void | { [UNDEFINED_VOID_ONLY]: never };
type EffectCallback = () => (void | Destructor);

type DependencyList = ReadonlyArray<any>
export function UseEffect({
  effect,
  deps
}: {
  effect: EffectCallback,
  deps?: DependencyList
}) {
  useEffect(effect, deps)
  return undefined
}
