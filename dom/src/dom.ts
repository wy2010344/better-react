import { hookAttrEffect, useAttrEffect, useMemo } from "better-react-helper"
import { ContentEditable, ListCreater, TOrQuote, createNodeTempOps, genTemplateString, lazyOrInit, } from "./util"
import { MemoEvent, TempOps, hookAddResult, hookBeginTempOps, hookCreateChangeAtom, hookEndTempOps } from "better-react"
import { DomAttribute, DomAttributeS, DomElement, DomElementType, React } from "./html"
import { SetValue, emptyFun, emptyObject, objectDiffDeleteKey, quoteOrLazyGet } from "wy-helper"
import { domTagNames, updateDom, updateStyle } from "./updateDom"
import { CSSProperties } from "wy-dom-helper"

export function createDomElement(e: MemoEvent<Node, string>) {
  return document.createElement(e.trigger)
}
export function useDomNode<T extends DomElementType>(
  type: T
): DomElement<T> {
  return useMemo(createDomElement, type)
}

export function useRenderHtml(node: InnerHTML, value: string) {
  useAttrEffect(() => {
    node.innerHTML = value
  }, [node, value])
}

function createUpdateDom<T extends DomElementType>(e: MemoEvent<SetValue<DomAttribute<T>>, DomElement<T>>): SetValue<DomAttribute<T>> {
  let oldAttrs: DomAttribute<T> = emptyObject
  return function (attrs) {
    updateDom(e.trigger, updateProps, attrs, oldAttrs)
    oldAttrs = attrs
  }
}
export function useUpdateDomNodeAttr<T extends DomElementType>(
  node: DomElement<T>
): SetValue<DomAttribute<T>> {
  return useMemo(createUpdateDom, node)
}



const emptyKeys = ['href', 'className']
export function updateProps(node: any, key: string, value?: any) {
  if (key.includes('-')) {
    node.setAttribute(key, value)
  } else {
    if (emptyKeys.includes(key) && !value) {
      node.removeAttribute(key)
    } else {
      node[key] = value
    }
  }
}

class DomHelper<T extends DomElementType> {
  public readonly node: DomElement<T>
  constructor(
    type: T
  ) {
    this.node = document.createElement(type)
  }
  private oldAttrs: DomAttribute<T> = emptyObject
  private contentType?: DomContentAs = undefined
  private content?: string = undefined
  private contentEditable?: ContentEditable
  updateAttrs(attrs: DomAttribute<T>) {
    updateDom(this.node, updateProps, attrs, this.oldAttrs)

    this.oldAttrs = attrs
  }

  private oldStyle: CSSProperties = emptyObject
  updateStyle(style: CSSProperties) {
    updateStyle(this.node, style, this.oldStyle)
    this.oldStyle = style
  }
  updateContent(contentType: "html" | "text", content: string, contentEditable?: ContentEditable) {
    if (contentType != this.contentType || content != this.content) {
      if (contentType == 'html') {
        this.node.innerHTML = content
      } else if (contentType == 'text') {
        this.node.textContent = content
      }
    }
    if (contentEditable != this.contentEditable) {
      this.node.contentEditable = (contentEditable || 'inherit') + ''
    }
    this.contentType = contentType
    this.content = content
    this.contentEditable = contentEditable
  }
  private tempOps!: TempOps<ListCreater>
  getTempOps() {
    if (!this.tempOps) {
      this.tempOps = createNodeTempOps(this.node, hookCreateChangeAtom())
    }
    return this.tempOps
  }
  static create<T extends DomElementType>(e: MemoEvent<DomHelper<T>, T>) {
    return new DomHelper(e.trigger)
  }
}

type DomContentAs = "html" | "text"
export class DomCreater<T extends DomElementType> {
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

  public attrsEffect: TOrQuote<DomAttribute<T>> = emptyObject
  public portal?: boolean

  attrs(v: TOrQuote<DomAttribute<T>>) {
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
  renderInnerHTML(innerHTML: string, contentEditable?: boolean | "inherit" | "plaintext-only") {
    const helper: DomHelper<T> = useMemo(DomHelper.create, this.type)
    const attrsEffect = this.attrsEffect
    this.after(helper)
    hookAttrEffect(() => {
      const attrs = lazyOrInit(attrsEffect)
      helper.updateAttrs(attrs)
      helper.updateContent("html", innerHTML, contentEditable)
    })
    return helper.node
  }
  renderTextContent(textContent: string, contentEditable?: boolean | "inherit" | "plaintext-only") {
    const helper: DomHelper<T> = useMemo(DomHelper.create, this.type)
    const attrsEffect = this.attrsEffect
    this.after(helper)
    hookAttrEffect(() => {
      const attrs = lazyOrInit(attrsEffect)
      helper.updateAttrs(attrs)
      helper.updateContent("text", textContent, contentEditable)
    })
    return helper.node
  }
  renderOut<O>(fun: (node: DomElement<T>) => O): O {
    const helper: DomHelper<T> = useMemo(DomHelper.create, this.type)
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
     * 任何render更新,都会通知它对应的dom子节点去更新,但在一次render中只通知一次.
     */
    const tempOps = helper.getTempOps()
    const before = hookBeginTempOps(tempOps)
    const out = fun(helper.node)
    hookEndTempOps(before!)
    return out
  }
  private after(helper: DomHelper<T>) {
    if (!this.portal) {
      hookAddResult(helper.node)
    }
  }
  render(fun: (node: DomElement<T>) => void = emptyFun): DomElement<T> {
    return this.renderOut(e => {
      fun(e);
      return e
    })
  }
}

let dom: {
  readonly [key in DomElementType]: {
    (props?: DomAttribute<key>, isPortal?: boolean): DomCreater<key>
    (fun: (v: DomAttributeS<key>) => DomAttributeS<key> | void, isPortal?: boolean): DomCreater<key>
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
      const creater = new DomCreater(p as DomElementType)
      const newV = function (args: any, isPortal: any) {
        creater.attrsEffect = args
        creater.portal = isPortal
        return creater
      }
      cacheDomMap.set(p as any, newV)
      return newV
    }
  })
} else {
  const cacheDom = {} as any
  dom = cacheDom
  domTagNames.forEach(function (tag) {
    const creater = new DomCreater(tag)
    cacheDom[tag] = function (args: any, isPortal: any) {
      creater.attrsEffect = args
      creater.portal = isPortal
      return creater
    }
  })
}

export {
  dom
}