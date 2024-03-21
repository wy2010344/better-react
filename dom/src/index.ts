import { render, VirtualDomOperator, RenderWithDep, renderFiber } from "better-react";
import { DomAttribute, DomElement, DomElementType, SvgAttribute, SvgElement, SvgElementType } from "./html";
import { EMPTYPROPS, FiberNode, FiberText, GetValueWithDep, domTagNames, emptyFun, svgTagNames, updateProps } from "./updateDom";
import { AskNextTimeWork, alawaysFalse, alawaysTrue, arrayNotEqualDepsWithEmpty, asLazy, emptyArray } from "wy-helper";
import { useAttrEffect } from "better-react-helper";
export { requestAnimationFrameScheduler } from './schedule'
export { isSVG, FiberNode, FiberText } from './updateDom'
export { getAliasOfAttribute, getAttributeAlias } from './getAttributeAlias'
export * from './html'
/***
 * 先声明dom节点再装入use配置参数,以实现dom节点复用?
 * 目前无需求.
 * 比如移动,其实一些dom状态会丢失,如scrollTop
 * 可能有一些三方组件的封装,配置参数却需要自定义,而不是dom参数
 * 这个事件提供的node节点是会被销毁的——可以不限制是svg或dom
 * updateProps虽然只处理dom,事实上永远不会起作用
 */
export function createRoot(node: Node, reconcile: () => void, getAsk: AskNextTimeWork) {
  return render(
    FiberNode.create(node, updateProps, true),
    reconcile,
    getAsk
  )
}
export function renderContent(content: string) {
  const dom = renderFiber([FiberText.create, content], alawaysTrue, emptyFun, undefined) as FiberText
  return dom.node
}


export function genTemplateString(ts: TemplateStringsArray, vs: (string | number)[]) {
  const xs: any[] = []
  for (let i = 0; i < vs.length; i++) {
    xs.push(ts[i])
    xs.push(vs[i])
  }
  xs.push(ts[vs.length])
  return xs.join('')
}

export const quoteEMPTYProps = [asLazy(EMPTYPROPS)] as const
export class DomCreater<T extends DomElementType>{
  constructor(
    public readonly props: GetValueWithDep<DomAttribute<T>>,
    public readonly create: (v: T) => FiberNode,
    public readonly createArg: T
  ) { }


  setPortal(v?: boolean) {
    if (v) {
      if (this.create != FiberNode.portalCreateDom) {
        return new DomCreater<T>(this.props, FiberNode.portalCreateDom, this.createArg)
      }
    } else {
      if (this.create != FiberNode.createDom) {
        return new DomCreater<T>(this.props, FiberNode.createDom, this.createArg)
      }
    }
    return this
  }
  asPortal() {
    return this.setPortal(true)
  }

  renderInnerHTML(innerHTML: string) {
    const dom = renderFiber(
      <VirtualDomOperator<any>>[this.create, this.props, this.createArg],
      alawaysFalse,
      emptyFun,
      undefined
    ) as FiberNode
    const node = dom.node as HTMLElement
    useAttrEffect(() => {
      node.innerHTML = innerHTML
    }, [innerHTML])
    return dom.node as unknown as DomElement<T>
  }
  renderTextContent(textContent: string) {
    const dom = renderFiber(
      <VirtualDomOperator<any>>[this.create, this.props, this.createArg],
      alawaysFalse,
      emptyFun,
      undefined
    ) as FiberNode
    const node = dom.node
    useAttrEffect(() => {
      node.textContent = textContent
    }, [textContent])
    return dom.node as unknown as DomElement<T>
  }
  renderHtml(ts: TemplateStringsArray, ...vs: (string | number)[]) {
    return this.renderInnerHTML(genTemplateString(ts, vs))
  }
  renderText(ts: TemplateStringsArray, ...vs: (string | number)[]) {
    return this.renderTextContent(genTemplateString(ts, vs))
  }
  renderContentEditable(contentEditable: true | "inherit" | "plaintext-only", text: string, as: "html" | "text"): void
  renderContentEditable(contentEditable?: true | "inherit" | "plaintext-only"): void
  renderContentEditable() {
    const contentEditable = arguments[0]
    const text = arguments[1]
    const as = arguments[2]
    const dom = renderFiber(
      <VirtualDomOperator<any>>[this.create, this.props, this.createArg],
      alawaysFalse,
      emptyFun,
      undefined
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

  renderBase<M>(...[shouldChange, render, deps]: RenderWithDep<M>) {
    const dom = renderFiber(
      <VirtualDomOperator<any>>[this.create, this.props, this.createArg],
      shouldChange,
      render,
      deps
    ) as FiberNode
    return dom.node as unknown as DomElement<T>
  }
  render<M extends readonly any[]>(render: (old: T | undefined, isNew: boolean, nv: T) => void, deps: T): DomElement<T>
  render(render: (old: undefined, isNew: boolean, nv: undefined) => void): DomElement<T>
  render(): DomElement<T>
  render() {
    return this.renderBase(arrayNotEqualDepsWithEmpty, arguments[0] || emptyFun, arguments[2])
  }
}
/**
 * @deprecated 使用dom['div'],dom.div
 * @param type 
 * @param props 
 * @returns 
 */
export function domOf<T extends DomElementType>(type: T, args?: DomAttribute<T>): DomCreater<T>
export function domOf<T extends DomElementType>(type: T, ...vs: GetValueWithDep<DomAttribute<T>>): DomCreater<T>
export function domOf<T extends DomElementType>(): DomCreater<T> {
  const type = arguments[0]
  const first = arguments[1]
  let list: any[] = quoteEMPTYProps as unknown as any[]
  if (first) {
    list = []
    if (typeof (first) == 'function') {
      list.push(first)
    } else {
      list.push(asLazy(first))
    }
    list.push(arguments[2])
  }
  return new DomCreater(list as any, FiberNode.createDom, type)
}
export class SvgCreater<T extends SvgElementType>{
  constructor(
    public readonly props: GetValueWithDep<SvgAttribute<T>>,
    public readonly create: (v: T) => FiberNode,
    public readonly createArg: T
  ) { }

  setPortal(v?: boolean) {
    if (v) {
      if (this.create != FiberNode.portalCreateSvg) {
        return new SvgCreater<T>(this.props, FiberNode.portalCreateSvg, this.createArg)
      }
    } else {
      if (this.create != FiberNode.createSvg) {
        return new SvgCreater<T>(this.props, FiberNode.createSvg, this.createArg)
      }
    }
    return this
  }
  asPortal() {
    return this.setPortal(true)
  }

  renderBase<M>(...[shouldChange, render, deps]: RenderWithDep<M>) {
    const dom = renderFiber(
      <VirtualDomOperator<any>>[this.create, this.props, this.createArg],
      shouldChange,
      render,
      deps
    ) as FiberNode
    return dom.node as unknown as SvgElement<T>
  }

  render<M extends readonly any[]>(render: (old: T | undefined, isNew: boolean, nv: T) => void, deps: T): SvgElement<T>
  render(render: (old: undefined, isNew: boolean, nv: undefined) => void): SvgElement<T>
  render(): SvgElement<T>
  render() {
    return this.renderBase(arrayNotEqualDepsWithEmpty, arguments[0] || emptyFun, arguments[2])
  }

  /**
   * svg的text可以用textContent与innerHTML,不能contentEditable
   * 但这里innerHTML主要是用来嵌套svg代码片段
   * textContent还可以用renderText来实现
   * @param innerHTML 
   * @returns 
   */
  renderInnerHTML(innerHTML: string) {
    const dom = renderFiber(
      <VirtualDomOperator<any>>[this.create, {
        ...this.props,
        innerHTML
      }, this.createArg],
      alawaysFalse,
      emptyFun,
      undefined
    ) as FiberNode
    return dom.node as unknown as SvgElement<T>
  }
  renderTextContent(textContent: string) {
    const dom = renderFiber(
      <VirtualDomOperator<any>>[this.create, {
        ...this.props,
        textContent
      }, this.createArg],
      alawaysFalse,
      emptyFun,
      undefined
    ) as FiberNode
    return dom.node as unknown as SvgElement<T>
  }
  renderHtml(ts: TemplateStringsArray, ...vs: (string | number)[]) {
    return this.renderInnerHTML(genTemplateString(ts, vs))
  }
  renderText(ts: TemplateStringsArray, ...vs: (string | number)[]) {
    return this.renderTextContent(genTemplateString(ts, vs))
  }
}

/**
 * @deprecated 使用svg['circle'],svg.circle
 * @param type 
 * @param props 
 * @returns 
 */
export function svgOf<T extends SvgElementType>(type: T, args?: SvgAttribute<T>): SvgCreater<T>
export function svgOf<T extends SvgElementType>(type: T, ...vs: GetValueWithDep<SvgAttribute<T>>): SvgCreater<T>
export function svgOf<T extends SvgElementType>(): SvgCreater<T> {
  const type = arguments[0]
  const first = arguments[1]
  let list: any[] = quoteEMPTYProps as unknown as any[]
  if (first) {
    list = []
    if (typeof (first) == 'function') {
      list.push(first)
    } else {
      list.push(asLazy(first))
    }
    list.push(arguments[2])
  }
  return new SvgCreater(list as any, FiberNode.createSvg, type)
}

let dom: {
  readonly [key in DomElementType]: {
    (props?: DomAttribute<key>): DomCreater<key>
    (fun: () => DomAttribute<key>, deps?: any[]): DomCreater<key>
  }
}
let svg: {
  readonly [key in SvgElementType]: {
    (props?: SvgAttribute<key>): SvgCreater<key>
    (fun: () => SvgAttribute<key>, deps?: any[]): SvgCreater<key>
  }
}
if ('Proxy' in globalThis) {
  const cacheDomMap = new Map<string, any>()
  dom = new Proxy({} as any, {
    get(_target, p, _receiver) {
      const oldV = cacheDomMap.get(p as any)
      if (oldV) {
        return oldV
      }
      const newV = function (args: any, deps: any) {
        return domOf(p as DomElementType, args, deps)
      }
      cacheDomMap.set(p as any, newV)
      return newV
    }
  })
  const cacheSvgMap = new Map<string, any>()
  svg = new Proxy({} as any, {
    get(_target, p, _receiver) {
      const oldV = cacheSvgMap.get(p as any)
      if (oldV) {
        return oldV
      }
      const newV = function (args: any, deps: any) {
        return svgOf(p as SvgElementType, args, deps)
      }
      cacheSvgMap.set(p as any, newV)
      return newV
    }
  })
} else {
  const cacheDom = {} as any
  dom = cacheDom
  domTagNames.forEach(function (tag) {
    cacheDom[tag] = function (args: any, deps: any) {
      return domOf(tag, args, deps)
    }
  })
  const cacheSvg = {} as any
  svg = cacheSvg
  svgTagNames.forEach(function (tag) {
    cacheSvg[tag] = function (args: any, deps: any) {
      return svgOf(tag, args, deps)
    }
  })
}

export {
  dom,
  svg
}