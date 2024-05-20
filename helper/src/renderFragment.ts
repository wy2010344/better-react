import { Fiber, MemoEvent, renderFiber } from "better-react"
import { arrayNotEqualDepsWithEmpty } from "wy-helper"


export function renderFragment<T extends readonly any[] = any[]>(
  fun: (e: MemoEvent<T>) => void, dep: T): Fiber
export function renderFragment(
  fun: (e: MemoEvent<undefined>) => void): void
export function renderFragment() {
  const [render, deps] = arguments
  return renderFiber(arrayNotEqualDepsWithEmpty, render, deps)
}