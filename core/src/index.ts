import { Fiber, FunctionNode, Props, VirtaulDomNode } from "./Fiber"
import { AskNextTimeWork, reconcile, setRootFiber } from "./reconcile"
export { useValue, useEffect, useRefValue, useMemo, useContext } from './fc'
export { Fiber, Props, VirtaulDomNode, createContext } from './Fiber'
export { FindParentAndBefore } from './commitWork'
export { AskNextTimeWork }
function RootFiberFun(fiber: Fiber) {
  return fiber.props!.children
}
export function render(
  element: any,
  container: VirtaulDomNode,
  ask: AskNextTimeWork
) {
  const rootFiber = {
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


function createFragment(props: Props) {
  return {
    type: createFragment,
    props,
    key: props?.key
  }
}
export const Fragment = createFragment
/**
 * 类似fragment
 * 但不会添加到父节点
 * 子节点会添加到其上
 * 自己被删除时是子节点删除，或者说，销毁事件里有清空子节点——都不太科学。。。像正常的销毁，不会移除
 * @param content
 * @param node 
 * @returns 
 */
export function createPortal(content: any, node: VirtaulDomNode): FunctionNode<any> {
  return {
    type: createPortal as any,
    props: {
      node,
      content
    }
  }
}