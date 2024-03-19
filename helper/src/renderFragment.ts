import { RenderWithDep, renderFiber } from "better-react";
import { arrayNotEqualDepsWithEmpty } from "wy-helper";

export function renderFragment<T extends readonly any[] = any[]>(fun: (old: T | undefined, isNew: boolean, nv: T) => void, dep: T): void
export function renderFragment(fun: (old: undefined, isNew: boolean, nv: undefined) => void): void
export function renderFragment() {
  const [render, deps] = arguments
  renderFiber(undefined, arrayNotEqualDepsWithEmpty, render, deps)
}