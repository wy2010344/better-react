import { RenderWithDep, renderFiber } from "better-react";

export function renderFragment<T extends readonly any[] = any[]>(...vs: RenderWithDep<T>): void
export function renderFragment() {
  const [render, deps] = arguments
  renderFiber(undefined, render, deps)
}