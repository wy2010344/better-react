import React, { DependencyList, EffectCallback, useEffect } from 'react'

export function UseEffect({
  effect,
  deps
}: {
  effect: EffectCallback,
  deps?: DependencyList
}) {
  useEffect(effect, deps)
  return <></>
}
