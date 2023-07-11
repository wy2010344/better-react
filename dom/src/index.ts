import { render, AskNextTimeWork, VirtualDomOperator, RenderWithDep, renderFiber } from "better-react";
import { DomAttribute, DomElement, DomElementType, SvgAttribute, SvgElement, SvgElementType } from "./html";
import { EMPTYPROPS, FiberNode, FiberText, emptyFun } from "./updateDom";
export { getScheduleAskTime } from './schedule'
export { StyleNode, isSVG, FiberNode, FiberText, StyleContext, underlineToCamel } from './updateDom'
export { getAliasOfAttribute, getAttributeAlias } from './getAttributeAlias'
export * from './html'
/***
 * 先声明dom节点再装入use配置参数,以实现dom节点复用?
 * 目前无需求.
 * 比如移动,其实一些dom状态会丢失,如scrollTop
 * 可能有一些三方组件的封装,配置参数却需要自定义,而不是dom参数
 */
export function createRoot(node: Node, reconcile: () => void, getAsk: AskNextTimeWork) {
  return render(
    FiberNode.create(node),
    EMPTYPROPS,
    reconcile,
    emptyFun,
    getAsk
  )
}
export function renderContent(content: string) {
  const dom = renderFiber([FiberText.create, content], emptyFun) as FiberText
  return dom.node
}


type MEMONode = () => void
export type DomWithChildren<T extends DomElementType> = DomAttribute<T> & ({
  children?: MEMONode;
  innerHTML?: never
  textContent?: never
  contentEditable?: never
} | {
  children?: never
  innerHTML: string
  textContent?: never
  contentEditable?: never
} | {
  children?: never
  innerHTML?: never
  textContent: string
  contentEditable?: never
} | {
  children?: never
  innerHTML?: never
  textContent?: never
  contentEditable: boolean | "inherit" | "plaintext-only";
} | {
  children?: never
  innerHTML?: never
  textContent?: never
  contentEditable?: never
})

export type SvgWithChildren<T extends SvgElementType> = SvgAttribute<T> & ({
  children: MEMONode;
  innerHTML?: never
} | {
  children?: never
  innerHTML: string
} | {
  children?: never
  innerHTML?: never
})
/**
 * 所有子节点都可以在render里声明,其实也就没必要再要子节点.
 * 节点是属性字典,没办法约束属性.
 * 字典属性醒来是diff更新的,只有函数惰性执行.
 * 可以只对children进行deps更新.
 * 只是因为恰好,children作为子节点,与fiber子节点对应.而renderFiber的deps本来也只针对各子成员的fiber,并不涉及自身属性
 * @deprecated
 * @param type 
 * @param render 
 * @param deps 
 */
export function useDom<T extends DomElementType>(type: T, props?: DomWithChildren<T>, deps?: any[]): DomElement<T> {
  const newProps = props || EMPTYPROPS as DomWithChildren<T>
  const dom = renderFiber(
    <VirtualDomOperator<any>>[FiberNode.createDom, newProps, type],
    getChildren(newProps),
    deps
  ) as FiberNode
  return dom.node as unknown as DomElement<T>
}

/**
 * @deprecated
 * @param type 
 * @param props 
 * @param deps 
 * @returns 
 */
export function useSvg<T extends SvgElementType>(type: T, props?: SvgWithChildren<T>, deps?: any[]): SvgElement<T> {
  const newProps = props || EMPTYPROPS as SvgWithChildren<T>
  const dom = renderFiber(
    <VirtualDomOperator<any>>[FiberNode.createSvg, newProps, type] as any,
    getChildren(newProps),
    deps
  ) as FiberNode
  return dom.node as unknown as SvgElement<T>
}

function getChildren(props: any) {
  return props.children || emptyFun
}


export class DomCreater<T extends DomElementType>{
  constructor(
    public readonly type: T,
    public readonly props: DomAttribute<T> = EMPTYPROPS
  ) { }
  renderChildren<M extends readonly any[]>(...vs: RenderWithDep<M>) {
    const dom = renderFiber(
      <VirtualDomOperator<any>>[FiberNode.createDom, this.props, this.type],
      ...vs
    ) as FiberNode
    return dom.node as unknown as DomElement<T>
  }
  renderInnerHTML(innerHTML: string) {
    const dom = renderFiber(
      <VirtualDomOperator<any>>[FiberNode.createDom, {
        ...this.props,
        innerHTML
      }, this.type],
      emptyFun
    ) as FiberNode
    return dom.node as unknown as DomElement<T>
  }
  renderTextContent(textContent: string) {
    const dom = renderFiber(
      <VirtualDomOperator<any>>[FiberNode.createDom, {
        ...this.props,
        textContent
      }, this.type],
      emptyFun
    ) as FiberNode
    return dom.node as unknown as DomElement<T>

  }
  renderContentEditable(contentEditable: boolean | "inherit" | "plaintext-only") {
    const dom = renderFiber(
      <VirtualDomOperator<any>>[FiberNode.createDom, {
        ...this.props,
        contentEditable
      }, this.type],
      emptyFun
    ) as FiberNode
    return dom.node as unknown as DomElement<T>
  }
  render() {
    const dom = renderFiber(
      <VirtualDomOperator<any>>[FiberNode.createDom, this.props, this.type],
      emptyFun
    ) as FiberNode
    return dom.node as unknown as DomElement<T>
  }
}

export function domOf<T extends DomElementType>(type: T, props?: DomAttribute<T>) {
  return new DomCreater(type, props)
}

export class SvgCreater<T extends SvgElementType>{
  constructor(
    public readonly type: T,
    public readonly props: SvgAttribute<T> = EMPTYPROPS
  ) { }

  render() {
    const dom = renderFiber(
      <VirtualDomOperator<any>>[FiberNode.createSvg, this.props, this.type] as any,
      emptyFun
    ) as FiberNode
    return dom.node as unknown as SvgElement<T>
  }

  renderInnerHTML(innerHTML: string) {
    const dom = renderFiber(
      <VirtualDomOperator<any>>[FiberNode.createSvg, {
        ...this.props,
        innerHTML
      }, this.type],
      emptyFun
    ) as FiberNode
    return dom.node as unknown as SvgElement<T>
  }

  renderChildren<M extends readonly any[]>(...vs: RenderWithDep<M>) {
    const dom = renderFiber(
      <VirtualDomOperator<any>>[FiberNode.createSvg, this.props, this.type],
      ...vs
    ) as FiberNode
    return dom.node as unknown as SvgElement<T>
  }
}

export function svgOf<T extends SvgElementType>(type: T, props?: SvgAttribute<T>) {
  return new SvgCreater(type, props)
}