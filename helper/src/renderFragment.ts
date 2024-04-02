import { StoreValueCreater, renderFiber } from "better-react";
import { arrayNotEqualDepsWithEmpty } from "wy-helper";
import { arrayStoreCreater } from "./util";


export function createRenderFragment(storeValueCreater: StoreValueCreater) {
  function renderFragment<T extends readonly any[] = any[]>(
    fun: (old: T | undefined, isNew: boolean, nv: T) => void, dep: T): void
  function renderFragment(
    fun: (old: undefined, isNew: boolean, nv: undefined) => void): void
  function renderFragment() {
    const [render, deps] = arguments
    renderFiber(storeValueCreater, arrayNotEqualDepsWithEmpty, render, deps)
  }
  return renderFragment
}

export const renderFragment = createRenderFragment(arrayStoreCreater)