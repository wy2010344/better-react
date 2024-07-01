import { Fiber, FiberEvent, renderFiber } from "better-react"
import { arrayNotEqualOrOne } from "wy-helper"

type FiberSelf = (e: FiberEvent<FiberSelf>) => void
export function renderFragment<T extends readonly any[] = any[]>(
  fun: (e: FiberEvent<T>) => void, dep: T): Fiber
export function renderFragment(
  fun: FiberSelf): void
export function renderFragment() {
  const render = arguments[0]
  const dep = arguments.length == 1 ? render : arguments[1]
  return renderFiber(arrayNotEqualOrOne, render, dep)
}