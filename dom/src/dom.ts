import { useAttrEffect, useMemo } from "better-react-helper"
import { createParentTrigger, genTemplateString } from "./util"
import { MemoEvent, hookAddResult, renderFiber } from "better-react"
import { DomAttribute, DomElement, DomElementType } from "./html"
import { arrayNotEqualDepsWithEmpty } from "wy-helper"
import { domTagNames, useUpdateDomNodeAttr } from "./updateDom"

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


export function useContentEditable(
  node: ElementContentEditable,
  contentEditable?: boolean | "inherit" | "plaintext-only",
) {
  useAttrEffect(() => {
    node.contentEditable = contentEditable + "" || "true"
  }, [node, contentEditable])
}

type AttrsEffect<T> = () => T
export class DomCreater<T extends DomElementType>{
  private constructor(
    public readonly type: T,
    public readonly attrsEffect: AttrsEffect<DomAttribute<T>>,
    public readonly portal?: boolean
  ) { }
  static of<T extends DomElementType>(
    type: T,
    attrsEffect: AttrsEffect<DomAttribute<T>> | DomAttribute<T>,
    portal?: boolean
  ) {
    return new DomCreater(
      type,
      typeof attrsEffect == 'function' ? attrsEffect : () => attrsEffect,
      portal
    )
  }
  renderHtml(ts: TemplateStringsArray, ...vs: (string | number)[]) {
    return this.renderInnerHTML(genTemplateString(ts, vs))
  }
  renderText(ts: TemplateStringsArray, ...vs: (string | number)[]) {
    return this.renderTextContent(genTemplateString(ts, vs))
  }
  renderInnerHTML(innerHTML: string, contentEditable?: boolean | "inherit" | "plaintext-only") {
    const node = this.render()
    useAttrEffect(() => {
      node.contentEditable = ((contentEditable || "") + "") || "inherit"
      node.innerHTML = innerHTML
    }, [innerHTML, contentEditable])
    return node
  }
  renderTextContent(textContent: string, contentEditable?: boolean | "inherit" | "plaintext-only") {
    const node = this.render()
    useAttrEffect(() => {
      node.contentEditable = ((contentEditable || "") + "") || "inherit"
      node.textContent = textContent
    }, [textContent, contentEditable])
    return node
  }

  render() {
    const node = useDomNode(this.type)
    const updateAttrs = useUpdateDomNodeAttr(node)
    useAttrEffect(() => {
      const attrs = this.attrsEffect()
      updateAttrs(attrs)
    })
    if (!this.portal) {
      hookAddResult(node)
    }
    return node
  }
  renderFragment<D extends any[]>(fun: (e: MemoEvent<D>) => void, deps: D): DomElement<T>
  renderFragment(fun: (e: MemoEvent<undefined>) => void): DomElement<T>
  renderFragment(fun: any, deps?: any) {
    const node = this.render()
    const config = useMemo(createParentTrigger, node)
    renderFiber(config, arrayNotEqualDepsWithEmpty, fun, deps)
    return node
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
      const newV = function (args: any, isPortal: any) {
        return DomCreater.of(p as DomElementType, args, isPortal)
      }
      cacheDomMap.set(p as any, newV)
      return newV
    }
  })
} else {
  const cacheDom = {} as any
  dom = cacheDom
  domTagNames.forEach(function (tag) {
    cacheDom[tag] = function (args: any, isPortal: any) {
      return DomCreater.of(tag, args, isPortal)
    }
  })
}

export {
  dom
}