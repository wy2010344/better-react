import { useFiber, render, AskNextTimeWork, VirtualDomOperator } from "better-react";
import { DomElement, DomElementType, DomElements, SvgElement, SvgElementType, SvgElements } from "./html";
import { EMPTYPROPS, FiberNode, FiberText, emptyFun } from "./updateDom";
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
  return render(
    FiberNode.create(node),
    {
      portalTarget() {
        return node.parentNode
      },
    },
    reconcile,
    ask
  )
}
export function useContent(content: string) {
  const dom = useFiber([FiberText.create, content], emptyFun) as FiberText
  return dom.node
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
  const newProps = props || EMPTYPROPS as DomElements[T]
  const dom = useFiber(
    <VirtualDomOperator<any>>[FiberNode.createDom, newProps, type],
    getChildren(newProps),
    deps
  ) as FiberNode
  return dom.node as unknown as DomElement<T>
}

export function useSvg<T extends SvgElementType>(type: T, props?: SvgElements[T], deps?: any[]): SvgElement<T> {
  const newProps = props || EMPTYPROPS as SvgElements[T]
  const dom = useFiber(
    <VirtualDomOperator<any>>[FiberNode.createSvg, newProps, type] as any,
    getChildren(newProps),
    deps
  ) as FiberNode
  return dom.node as unknown as SvgElement<T>
}

function getChildren(props: any) {
  return props.children || emptyFun
}