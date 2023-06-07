import { RenderWithDep, useFiber } from "better-react";

export function useFragment<T extends readonly any[] = any[]>(...vs: RenderWithDep<T>): void
export function useFragment() {
  const [render, deps] = arguments
  useFiber(undefined, render, deps)
}