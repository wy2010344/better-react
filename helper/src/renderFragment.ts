import { FiberConfig, RenderWithDep, renderFiber } from "better-react";
import { arrayNotEqualDepsWithEmpty } from "wy-helper";

export function renderFragment<T extends readonly any[] = any[]>(
  config: FiberConfig,
  fun: (old: T | undefined, isNew: boolean, nv: T) => void, dep: T): void
export function renderFragment(
  config: FiberConfig,
  fun: (old: undefined, isNew: boolean, nv: undefined) => void): void
export function renderFragment(config: FiberConfig) {
  const [render, deps] = arguments
  renderFiber(config, arrayNotEqualDepsWithEmpty, render, deps)
}