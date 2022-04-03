import { BRNode, BRFun, Fiber, VirtaulDomNode } from "./Fiber"
import { AskNextTimeWork, reconcile, setRootFiber } from "./reconcile"
export { useValue, useEffect, useRefValue, useMemo, findContext } from './fc'
export { Fiber, Props, VirtaulDomNode, createContext, Context, BRFun, BRNode } from './Fiber'
export { FindParentAndBefore } from './commitWork'
export { AskNextTimeWork }
function RootFiberFun(fiber: Fiber) {
  return fiber.props!.children
}
const ROOTTYPE: BRFun<FragmentParam> = (props) => {
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
  setRootFiber(rootFiber, ask)
  reconcile()
}
export type FragmentParam = {
  children?: BRNode<any> | BRNode<any>[]
}
export const Fragment: BRFun<FragmentParam> = (props) => {
  return {
    type: Fragment,
    props
  }
}
/**
 * 类似fragment
 * 但不会添加到父节点
 * 子节点会添加到其上
 * 自己被删除时是子节点删除，或者说，销毁事件里有清空子节点——都不太科学。。。像正常的销毁，不会移除
 */

type PortalParam = {
  node: VirtaulDomNode
} & FragmentParam
export const Portal: BRFun<PortalParam> = (props) => {
  return {
    type: Portal,
    props
  }
}