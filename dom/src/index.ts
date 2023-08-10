import { render, AskNextTimeWork, VirtualDomOperator, RenderWithDep, renderFiber, useAttrEffect, emptyArray } from "better-react";
import { DomAttribute, DomElement, DomElementType, SvgAttribute, SvgElement, SvgElementType } from "./html";
import { EMPTYPROPS, FiberNode, FiberText, emptyFun, updatePorps } from "./updateDom";
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
    FiberNode.create(node, updatePorps),
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


export class DomCreater<T extends DomElementType, M>{
  constructor(
    public readonly props: DomAttribute<T> = EMPTYPROPS,
    public readonly create: (v: M) => FiberNode,
    public readonly createArg: M
  ) { }
  renderInnerHTML(innerHTML: string) {
    const dom = renderFiber(
      <VirtualDomOperator<any>>[this.create, {
        ...this.props,
        innerHTML
      }, this.createArg],
      emptyFun
    ) as FiberNode
    return dom.node as unknown as DomElement<T>
  }
  renderTextContent(textContent: string) {
    const dom = renderFiber(
      <VirtualDomOperator<any>>[this.create, {
        ...this.props,
        textContent
      }, this.createArg],
      emptyFun
    ) as FiberNode
    return dom.node as unknown as DomElement<T>
  }
  renderContentEditable(contentEditable: true | "inherit" | "plaintext-only", text: string, as: "html" | "text"): void
  renderContentEditable(contentEditable?: true | "inherit" | "plaintext-only"): void
  renderContentEditable() {
    const contentEditable = arguments[0]
    const text = arguments[1]
    const as = arguments[2]
    const dom = renderFiber(
      <VirtualDomOperator<any>>[this.create, this.props, this.createArg],
      emptyFun
    ) as FiberNode
    const node = dom.node as unknown as DomElement<T>
    useAttrEffect(() => {
      node.contentEditable = contentEditable || "true"
      if (text) {
        if (as == "html") {
          node.innerHTML = text
        } else if (as == "text") {
          node.textContent = text
        }
      }
    }, emptyArray)
    return node
  }
  render<M extends readonly any[]>(...vs: RenderWithDep<M>): DomElement<T>
  render(): DomElement<T>
  render() {
    const render = arguments[0] || emptyFun
    const deps = arguments[1]
    const dom = renderFiber(
      <VirtualDomOperator<any>>[this.create, this.props, this.createArg],
      render,
      deps
    ) as FiberNode
    return dom.node as unknown as DomElement<T>
  }
}

export function domOf<T extends DomElementType>(type: T, props?: DomAttribute<T>) {
  return new DomCreater(props, FiberNode.createDom, type)
}
export function domExistOf<T extends DomElementType>(node: DomElement<T>, props?: DomAttribute<T>) {
  return new DomCreater(props, FiberNode.createDomWith, node);
}
export function portalDomOf<T extends DomElementType>(type: T, props?: DomAttribute<T>) {
  return new DomCreater(props, FiberNode.portalCreateDom, type)
}
export function portalDomExistOf<T extends DomElementType>(node: DomElement<T>, props?: DomAttribute<T>) {
  return new DomCreater(props, FiberNode.portalCreateDomWith, node);
}
export class SvgCreater<T extends SvgElementType, M>{
  constructor(
    public readonly props: SvgAttribute<T> = EMPTYPROPS,
    public readonly create: (v: M) => FiberNode,
    public readonly createArg: M
  ) { }

  render<M extends readonly any[]>(...vs: RenderWithDep<M>): SvgElement<T>
  render(): SvgElement<T>
  render() {
    const render = arguments[0] || emptyFun
    const deps = arguments[1]
    const dom = renderFiber(
      <VirtualDomOperator<any>>[this.create, this.props, this.createArg] as any,
      render,
      deps
    ) as FiberNode
    return dom.node as unknown as SvgElement<T>
  }

  renderInnerHTML(innerHTML: string) {
    const dom = renderFiber(
      <VirtualDomOperator<any>>[this.create, {
        ...this.props,
        innerHTML
      }, this.createArg],
      emptyFun
    ) as FiberNode
    return dom.node as unknown as SvgElement<T>
  }
}

export function svgOf<T extends SvgElementType>(type: T, props?: SvgAttribute<T>) {
  return new SvgCreater(props, FiberNode.createSvg, type)
}
export function svgExistOf<T extends SvgElementType>(node: SvgElement<T>, props?: SvgAttribute<T>) {
  return new SvgCreater(props, FiberNode.createSvgWith, node);
}

export function portalSvgOf<T extends SvgElementType>(type: T, props?: SvgAttribute<T>) {
  return new SvgCreater(props, FiberNode.portalCreateSvg, type)
}
export function portalSvgExistOf<T extends SvgElementType>(node: SvgElement<T>, props?: SvgAttribute<T>) {
  return new SvgCreater(props, FiberNode.portalCreateSvgWith, node);
}