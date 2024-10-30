import { EffectEvent, MemoEvent, TempOps, hookAddResult, hookBeginTempOps, hookCreateChangeAtom, hookEndTempOps } from "better-react"
import { SvgAttribute, SvgAttributeS, SvgAttributeSO, SvgElement, SvgElementType } from "wy-dom-helper"
import { hookAttrEffect, useAttrEffect, useMemo } from "better-react-helper"
import { updateDom } from "wy-dom-helper"
import { emptyFun, emptyObject, VType } from "wy-helper"
import { updateDomProps, useMerge } from "./dom"
import { getAttributeAlias } from "wy-dom-helper"
import { ListCreater, TOrQuote, createNodeTempOps, lazyOrInit } from "./util"
import { svgTagNames } from "wy-dom-helper"

export function updateSVGProps(node: any, key: string, value?: any) {
  if (key == 'innerHTML' || key == 'textContent') {
    updateDomProps(node, key, value)
  } else {
    if (key == 'className') {
      node.setAttribute('class', value || '')
    } else {
      key = getAttributeAlias(key)
      if (value) {
        node.setAttribute(key, value)
      } else {
        node.removeAttribute(key)
      }
    }
  }
}

export function createSvgElement(e: MemoEvent<Node, string>) {
  return document.createElementNS("http://www.w3.org/2000/svg", e.trigger)
}
export function useSvgNode<T extends SvgElementType>(
  type: T
): SvgElement<T> {
  return useMemo(createSvgElement, type)
}






class SvgHelper<T extends SvgElementType> {
  public readonly node: SvgElement<T>
  constructor(
    type: T
  ) {
    this.node = document.createElementNS("http://www.w3.org/2000/svg", type)
  }
  private oldAttrs: SvgAttribute<T> = emptyObject as any
  private oldDes = {}
  updateAttrs(attrs: SvgAttribute<T>) {
    this.oldDes = updateDom(this.node, updateSVGProps, attrs, this.oldAttrs, this.oldDes)
    this.oldAttrs = attrs
  }

  updateHTML = (content: string) => {
    this.node.innerHTML = content
  }
  updateText = (content: string) => {
    this.node.textContent = content
  }

  updateHTMLTrigger = (e: EffectEvent<undefined, string>) => {
    this.node.innerHTML = e.trigger
  }

  updateTextTrigger = (e: EffectEvent<undefined, string>) => {
    this.node.textContent = e.trigger
  }

  private tempOps!: TempOps<ListCreater>
  getTempOps() {
    if (!this.tempOps) {
      this.tempOps = createNodeTempOps(this.node, hookCreateChangeAtom())
    }
    return this.tempOps
  }
  static create<T extends SvgElementType>(e: MemoEvent<SvgHelper<T>, T>) {
    return new SvgHelper(e.trigger)
  }
}

type SvgContentAs = "html" | "text"
export class SvgCreater<T extends SvgElementType> {
  /**
   * 其实这3个属性可以改变,
   * 因为只在最终render阶段释放.
   * 主要是portal可以改变
   * 其实attr也可以改变.只有type一开始就不再可以改变
   * @param type 
   * @param attrsEffect 
   * @param portal 
   */
  constructor(
    public readonly type: T
  ) { }

  public attrsEffect: TOrQuote<SvgAttribute<T>> = emptyObject as any
  public portal?: boolean

  attrs(v: TOrQuote<SvgAttribute<T>>) {
    this.attrsEffect = v
    return this
  }

  setPortal(b: any) {
    this.portal = b
    return this
  }

  private useHelper() {
    const helper: SvgHelper<T> = useMemo(SvgHelper.create, this.type)
    const attrsEffect = this.attrsEffect
    this.after(helper)
    hookAttrEffect(() => {
      const attrs = lazyOrInit(attrsEffect)
      helper.updateAttrs(attrs)
    })
    return helper

  }

  renderHtml(ts: TemplateStringsArray, ...vs: VType[]) {
    const helper = this.useHelper()
    useMerge(helper.updateHTML, ts, vs)
    return helper.node
  }
  renderText(ts: TemplateStringsArray, ...vs: VType[]) {
    const helper = this.useHelper()
    useMerge(helper.updateText, ts, vs)
    return helper.node
  }
  renderInnerHTML(innerHTML = '') {
    const helper = this.useHelper()
    useAttrEffect(helper.updateHTMLTrigger, innerHTML)
    return helper.node
  }
  renderTextContent(textContent = '') {
    const helper = this.useHelper()
    useAttrEffect(helper.updateTextTrigger, textContent)
    return helper.node
  }


  renderOut<O>(fun: (node: SvgElement<T>) => O): O {
    const helper: SvgHelper<T> = useMemo(SvgHelper.create, this.type)
    const attrsEffect = this.attrsEffect
    this.after(helper)
    hookAttrEffect(() => {
      const attrs = lazyOrInit(attrsEffect)
      helper.updateAttrs(attrs)
    })
    /**
     * @todo 应该可以移除fiber依赖,手动确立是否需要
     * 将storeValueCreater放到context上去,不,是像hook一样放在当前遍历的全局
     * 因为与fiber无关,故不使用deps.
     * 可以手动开启使用fragment.
     * 
     * 设想,fragment存array.
     * 任何render更新,都会通知它对应的Svg子节点去更新,但在一次render中只通知一次.
     */
    const tempOps = helper.getTempOps()
    const before = hookBeginTempOps(tempOps)
    const out = fun(helper.node)
    hookEndTempOps(before!)
    return out
  }
  private after(helper: SvgHelper<T>) {
    if (!this.portal) {
      hookAddResult(helper.node)
    }
  }
  render(fun: (node: SvgElement<T>) => void = emptyFun): SvgElement<T> {
    return this.renderOut(e => {
      fun(e);
      return e
    })
  }
}


let svg: {
  readonly [key in SvgElementType]: {
    (props?: SvgAttribute<key> | SvgAttributeSO<key>, isPortal?: boolean): SvgCreater<key>
    (fun: (v: SvgAttributeS<key>) => SvgAttributeS<key> | void, isPortal?: boolean): SvgCreater<key>
  }
}
if ('Proxy' in globalThis) {
  const cacheSvgMap = new Map<string, any>()
  svg = new Proxy(emptyObject as any, {
    get(_target, p, _receiver) {
      const oldV = cacheSvgMap.get(p as any)
      if (oldV) {
        return oldV
      }
      const creater = new SvgCreater(p as SvgElementType)
      const newV = function (args: any, isPortal: any) {
        creater.attrsEffect = args
        creater.portal = isPortal
        return creater
      }
      cacheSvgMap.set(p as any, newV)
      return newV
    }
  })
} else {
  const cacheSvg = {} as any
  svg = cacheSvg
  svgTagNames.forEach(function (tag) {
    const creater = new SvgCreater(tag)
    cacheSvg[tag] = function (args: any, isPortal: any) {
      creater.attrsEffect = args
      creater.portal = isPortal
      return creater
    }
  })
}

export {
  svg
}