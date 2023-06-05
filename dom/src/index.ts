import { useFiber, render, AskNextTimeWork } from "better-react";
import { DomElement, DomElementType, DomElements, SvgElement, SvgElementType, SvgElements } from "./html";
import { EMPTYPROPS, FiberNode, FiberText, emptyFun } from "./updateDom";
import { useCurrentFiber } from "better-react";
export { scheduleAskTime } from './schedule'
export { StyleNode, isSVG, FiberNode, FiberText, StyleContext, underlineToCamel } from './updateDom'
export { getAliasOfAttribute, getAttributeAlias } from './getAttributeAlias'
export * from './html'
/***
 * 先声明dom节点再装入use配置参数,以实现dom节点复用?
 * 目前无需求.
 * 比如移动,其实一些dom状态会丢失,如scrollTop
 * 可能有一些三方组件的封装,配置参数却需要自定义,而不是dom参数
 */
export function createRoot(node: Node, reconcile: () => void, ask: AskNextTimeWork) {
  return render(function () {
    const fiber = useCurrentFiber()
    let dom = fiber.dom! as FiberNode
    if (!dom) {
      dom = FiberNode.create(node)
      fiber.dom = dom
    }
    dom.useUpdateProps({
      portalTarget() {
        return node.parentNode
      },
    })
    reconcile()
  }, ask)
}
export function useContent(content: string) {
  const fiber = useFiber(emptyFun)
  let dom = fiber.dom as FiberText
  if (!dom) {
    dom = FiberText.create()
    fiber.dom = dom
  }
  dom.useUpdateProps(content)
  return (fiber.dom as any).node as Text
}

/**
 * 不使用deps优化.
 * 需要的时候自己用Fragment优化
 * 因为这里面已经有属性对比优化
 */
function NodeRender(deps?: any[]) {
  const dom = useCurrentFiber().dom! as FiberNode
  dom.getProps()?.children?.(deps)
}
/**
 * 所有子节点都可以在render里声明,其实也就没必要再要子节点.
 * 节点是属性字典,没办法约束属性.
 * 字典属性醒来是diff更新的,只有函数惰性执行.
 * 可以只对children进行deps更新.
 * 只是因为恰好,children作为子节点,与fiber子节点对应.而useFiber的deps本来也只针对各子成员的fiber,并不涉及自身属性
 * @param type 
 * @param render 
 * @param deps 
 */
export function useDom<T extends DomElementType>(type: T, props?: DomElements[T], deps?: any[]): DomElement<T> {
  const fiber = useFiber(NodeRender, deps)
  let dom = fiber.dom as FiberNode
  if (!dom) {
    dom = FiberNode.createDom(type)
    fiber.dom = dom
  }
  dom.useUpdateProps(props || EMPTYPROPS)
  return dom.node as unknown as DomElement<T>
}

export function useSvg<T extends SvgElementType>(type: T, props?: SvgElements[T], deps?: any[]): SvgElement<T> {
  const fiber = useFiber(NodeRender, deps)
  let dom = fiber.dom as FiberNode
  if (!dom) {
    dom = FiberNode.createSvg(type)
    fiber.dom = dom
  }
  dom.useUpdateProps(props || EMPTYPROPS)
  return dom.node as unknown as SvgElement<T>
}