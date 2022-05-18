import { Fiber, VirtaulDomNode } from "./Fiber"
import { AskNextTimeWork, setRootFiber } from "./reconcile"
export { flushSync, startTransition } from './reconcile'
export type { REAL_WORK } from './reconcile'
export { useState, useEffect, storeRef, useMemo, createContext } from './fc'
export type { Fiber, Props, VirtaulDomNode } from './Fiber'
export type { FindParentAndBefore } from './commitWork'
export type { AskNextTimeWork }
function RootFiberFun(fiber: Fiber<() => void>) {
  console.log("RENDER", fiber.props)
  fiber.props()
}
export function render(
  element: () => void,
  container: VirtaulDomNode,
  ask: AskNextTimeWork
) {
  const rootFiber: Fiber = {
    render: RootFiberFun,
    dom: container,
    props: element,
    effectTag: "UPDATE"
  } as const
  return setRootFiber(rootFiber, ask)
}