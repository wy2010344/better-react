import { Fiber, MemoEvent, StoreValueCreater, hookAddResult, renderFiber } from "better-react";
import { arrayNotEqualDepsWithEmpty } from "wy-helper";
import { arrayStoreCreater } from "./util";


export function createRenderFragment(storeValueCreater: StoreValueCreater) {
  function renderFragment<T extends readonly any[] = any[]>(
    fun: (e: MemoEvent<T>) => void, dep: T, asPortal?: boolean): Fiber
  function renderFragment(
    fun: (e: MemoEvent<undefined>) => void): void
  function renderFragment() {
    const [render, deps, asPortal] = arguments
    const fiber = renderFiber(storeValueCreater, arrayNotEqualDepsWithEmpty, render, deps)
    if (asPortal) {
      return fiber
    }
    hookAddResult(fiber)
  }
  return renderFragment
}

export const renderFragment = createRenderFragment(arrayStoreCreater)