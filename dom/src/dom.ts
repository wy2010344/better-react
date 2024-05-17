import { hookAttrEffect, useAttrEffect, useMemo } from "better-react-helper"
import { createStoreValueCreater, genTemplateString } from "./util"
import { MemoEvent, StoreValueCreater, hookAddResult, renderFiber } from "better-react"
import { DomAttribute, DomElement, DomElementType } from "./html"
import { arrayNotEqualDepsWithEmpty, emptyObject, quoteOrLazyGet } from "wy-helper"
import { domTagNames, updateDom } from "./updateDom"

export function createDomElement(e: MemoEvent<string>) {
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


function createUpdateDom<T extends DomElementType>(e: MemoEvent<DomElement<T>>) {
  let oldAttrs: DomAttribute<T> = emptyObject
  return function (attrs: DomAttribute<T>) {
    updateDom(e.trigger, updateProps, attrs, oldAttrs)
    oldAttrs = attrs
  }
}
export function useUpdateDomNodeAttr<T extends DomElementType>(
  node: DomElement<T>
) {
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


  private storeValueCreater: StoreValueCreater | undefined = undefined
  getStoreValueCreater() {
    if (!this.storeValueCreater) {
      this.storeValueCreater = createStoreValueCreater(this.node)
    }
    return this.storeValueCreater
  }
  static create<T extends DomElementType>(e: MemoEvent<T>) {
    return new DomHelper(e.trigger)
  }
}

type DomContentAs = "html" | "text"
type ContentEditable = boolean | "inherit" | "plaintext-only"


export function useContentEditable(
  node: ElementContentEditable,
  contentEditable?: boolean | "inherit" | "plaintext-only",
) {
  useAttrEffect(() => {
    node.contentEditable = contentEditable + "" || "true"
  }, [node, contentEditable])
}

type AttrsEffect<T> = () => T
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

  public attrsEffect: AttrsEffect<DomAttribute<T>> | DomAttribute<T> = emptyObject
  public portal?: boolean

  attrs(v: AttrsEffect<DomAttribute<T>> | DomAttribute<T>) {
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
    const helper = useMemo(DomHelper.create, this.type)
    const attrsEffect = this.attrsEffect
    hookAttrEffect(() => {
      const attrs = quoteOrLazyGet(attrsEffect)
      helper.updateAttrs(attrs)
      helper.updateContent("html", innerHTML, contentEditable)
    })
    return this.after(helper)
  }
  renderTextContent(textContent: string, contentEditable?: boolean | "inherit" | "plaintext-only") {
    const helper = useMemo(DomHelper.create, this.type)
    const attrsEffect = this.attrsEffect
    hookAttrEffect(() => {
      const attrs = quoteOrLazyGet(attrsEffect)
      helper.updateAttrs(attrs)
      helper.updateContent("text", textContent, contentEditable)
    })
    return this.after(helper)
  }
  render() {
    const helper = useMemo(DomHelper.create, this.type)
    const attrsEffect = this.attrsEffect
    hookAttrEffect(() => {
      const attrs = quoteOrLazyGet(attrsEffect)
      helper.updateAttrs(attrs)
    })
    return this.after(helper)
  }
  private after(helper: DomHelper<T>) {
    if (!this.portal) {
      hookAddResult(helper.node)
    }
    return helper.node
  }
  renderFragment<D extends readonly any[]>(fun: (e: MemoEvent<D>) => void, deps: D): DomElement<T>
  renderFragment(fun: (e: MemoEvent<undefined>) => void): DomElement<T>
  renderFragment(fun: any, deps?: any) {
    const helper = useMemo(DomHelper.create, this.type)
    const attrsEffect = this.attrsEffect
    hookAttrEffect(() => {
      const attrs = quoteOrLazyGet(attrsEffect)
      helper.updateAttrs(attrs)
    })
    renderFiber(helper.getStoreValueCreater(), arrayNotEqualDepsWithEmpty, fun, deps)
    return this.after(helper)
  }
}



let dom: {
  readonly [key in DomElementType]: {
    (props?: DomAttribute<key>, isPortal?: boolean): DomCreater<key>
    (fun: () => DomAttribute<key>, isPortal?: boolean): DomCreater<key>
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