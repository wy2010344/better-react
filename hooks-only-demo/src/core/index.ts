import { Fiber, VirtaulDomNode } from "./Fiber"
import { AskNextTimeWork, setRootFiber } from "./reconcile"
export { flushSync, startTransition } from './reconcile'
export type { REAL_WORK } from './reconcile'
export { useValue, useEffect, storeRef, useMemo, createContext } from './fc'
export type { Fiber, Props, VirtaulDomNode } from './Fiber'
export type { FindParentAndBefore } from './commitWork'
export type { AskNextTimeWork }
function RootFiberFun(fiber: Fiber) {
  return fiber.props!.children
}
const ROOTTYPE: BRFun<any> = (props) => {
  return {
    type: ROOTTYPE,
    props
  }
}
export function render(
  element: any,
  container: VirtaulDomNode,
  ask: AskNextTimeWork
) {
  const rootFiber: Fiber = {
    type: ROOTTYPE,
    render: RootFiberFun,
    dom: container,
    props: {
      children: [element]
    },
    effectTag: "UPDATE"
  } as const
  return setRootFiber(rootFiber, ask)
}