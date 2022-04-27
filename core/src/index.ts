import { BRFun, Fiber, VirtaulDomNode } from "./Fiber"
import { AskNextTimeWork, setRootFiber } from "./reconcile"
export { useValue, useEffect, useRefValue, useMemo, createContext } from './fc'
export { Fiber, Props, VirtaulDomNode, BRFun, BRNode } from './Fiber'
export { FindParentAndBefore } from './commitWork'
export { AskNextTimeWork }
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