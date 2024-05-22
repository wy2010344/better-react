import { MemoEvent, TempOps, hookAddResult, hookBeginTempOps, hookCreateChangeAtom, hookEndTempOps } from "better-react"
import { SvgAttribute, SvgElement, SvgElementType } from "./html"
import { hookAttrEffect, useAttrEffect, useMemo } from "better-react-helper"
import { updateDom } from "./updateDom"
import { emptyFun, emptyObject, quoteOrLazyGet } from "wy-helper"
import { updateProps } from "./dom"
import { getAttributeAlias } from "./getAttributeAlias"
import { ListCreater, createNodeTempOps, genTemplateString } from "./util"
import { svgTagNames } from "./updateDom"


function createUpdateSvg<T extends SvgElementType>(e: MemoEvent<SvgElement<T>>) {
  let oldAttrs: SvgAttribute<T> = emptyObject
  return function (attrs: SvgAttribute<T>) {
    updateDom(e.trigger, updateSVGProps, attrs, oldAttrs)
    oldAttrs = attrs
  }
}



function updateSVGProps(node: any, key: string, value?: any) {
  if (key == 'innerHTML' || key == 'textContent') {
    updateProps(node, key, value)
  } else {
    if (value) {
      if (key == 'className') {
        key = 'class'
      }
      key = getAttributeAlias(key)
      node.setAttribute(key, value)
    } else {
      node.removeAttribute(key)
    }
  }
}

export function useUpdateSvgNodeAttr<T extends SvgElementType>(
  node: SvgElement<T>
) {
  return useMemo(createUpdateSvg, node)
}

export function createSvgElement(e: MemoEvent<string>) {
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
  private oldAttrs: SvgAttribute<T> = emptyObject
  private contentType?: SvgContentAs = undefined
  private content?: string = undefined
  updateAttrs(attrs: SvgAttribute<T>) {
    updateDom(this.node, updateSVGProps, attrs, this.oldAttrs)
    this.oldAttrs = attrs
  }
  updateContent(contentType: "html" | "text", content: string) {
    if (contentType != this.contentType || content != this.content) {
      if (contentType == 'html') {
        this.node.innerHTML = content
      } else if (contentType == 'text') {
        this.node.textContent = content
      }
    }
    this.contentType = contentType
    this.content = content
  }
  private tempOps!: TempOps<ListCreater>
  getTempOps() {
    if (!this.tempOps) {
      this.tempOps = createNodeTempOps(this.node, hookCreateChangeAtom())
    }
    return this.tempOps
  }
  static create<T extends SvgElementType>(e: MemoEvent<T>) {
    return new SvgHelper(e.trigger)
  }
}

type SvgContentAs = "html" | "text"

type AttrsEffect<T> = () => T
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

  public attrsEffect: AttrsEffect<SvgAttribute<T>> | SvgAttribute<T> = emptyObject
  public portal?: boolean

  attrs(v: AttrsEffect<SvgAttribute<T>> | SvgAttribute<T>) {
    this.attrsEffect = v
    return this
  }

  setPortal(b: any) {
    this.portal = b
    return this
  }

  renderHtml(ts: TemplateStringsArray, ...vs: (string | number)[]) {
    return this.renderInnerHTML(genTemplateString(ts, vs))
  }
  renderText(ts: TemplateStringsArray, ...vs: (string | number)[]) {
    return this.renderTextContent(genTemplateString(ts, vs))
  }
  renderInnerHTML(innerHTML: string) {
    const helper = useMemo(SvgHelper.create, this.type)
    const attrsEffect = this.attrsEffect
    hookAttrEffect(() => {
      const attrs = quoteOrLazyGet(attrsEffect)
      helper.updateAttrs(attrs)
      helper.updateContent("html", innerHTML)
    })
    return this.after(helper)
  }
  renderTextContent(textContent: string) {
    const helper = useMemo(SvgHelper.create, this.type)
    const attrsEffect = this.attrsEffect
    hookAttrEffect(() => {
      const attrs = quoteOrLazyGet(attrsEffect)
      helper.updateAttrs(attrs)
      helper.updateContent("text", textContent)
    })
    return this.after(helper)
  }
  renderOut<O>(fun: (node: SvgElement<T>) => O): O {
    const helper = useMemo(SvgHelper.create, this.type)
    const attrsEffect = this.attrsEffect
    hookAttrEffect(() => {
      const attrs = quoteOrLazyGet(attrsEffect)
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
    this.after(helper)
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
    (props?: SvgAttribute<key>, isPortal?: boolean): SvgCreater<key>
    (fun: () => SvgAttribute<key>, isPortal?: boolean): SvgCreater<key>
  }
}
if ('Proxy' in globalThis) {
  const cacheSvgMap = new Map<string, any>()
  svg = new Proxy({} as any, {
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