import { hookAttrEffect, useAttrEffect, useMemo } from "better-react-helper"
import { ListCreater, TOrQuote, createNodeTempOps, lazyOrInit, } from "./util"
import { EffectEvent, MemoEvent, TempOps, hookAddResult, hookBeginTempOps, hookCreateChangeAtom, hookEndTempOps } from "better-react"
import { DomAttribute, DomAttributeS, DomAttributeSO, DomElement, DomElementType } from "wy-dom-helper"
import { emptyFun, emptyObject, genTemplateStringS2, trackSignal, VType } from "wy-helper"
import { domTagNames, updateDom } from "wy-dom-helper"

export function createDomElement(e: MemoEvent<Node, string>) {
  return document.createElement(e.trigger)
}
export function useDomNode<T extends DomElementType>(
  type: T
): DomElement<T> {
  return useMemo(createDomElement, type)
}
export function useMerge(
  update: (text: string) => void,
  ts: TemplateStringsArray,
  vs: VType[]) {
  useAttrEffect(() => {
    return trackSignal(() => {
      return genTemplateStringS2(ts, vs)
    }, update)
  }, vs)
}
export function useRenderHtml(node: {
  innerHTML: string
}, value: string) {
  useAttrEffect(() => {
    node.innerHTML = value
  }, [node, value])
}

const emptyKeys = ['href', 'className']
export function updateDomProps(node: any, key: string, value?: any) {
  if (key.includes('-')) {
    node.setAttribute(key, value)
  } else {
    if (emptyKeys.includes(key) && !value) {
      node[key] = ''
    } else {
      node[key] = value
    }
  }
}
export type DomTextOrFunNode<T extends DomElementType> = string | number | boolean | null | ((v: DomElement<T>) => void)
class DomHelper<T extends DomElementType> {
  public readonly node: DomElement<T>
  constructor(
    type: T
  ) {
    this.node = document.createElement(type)
  }
  private oldAttrs: DomAttribute<T> = emptyObject as any
  private oldDes = {}
  updateAttrs(attrs: DomAttribute<T>) {
    this.oldDes = updateDom(this.node, updateDomProps, attrs, this.oldAttrs, this.oldDes)
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
  static create<T extends DomElementType>(e: MemoEvent<DomHelper<T>, T>) {
    return new DomHelper(e.trigger)
  }
}
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

  public attrsEffect: TOrQuote<DomAttribute<T>> = emptyObject as any
  public portal?: boolean

  attrs(v: TOrQuote<DomAttribute<T>>) {
    this.attrsEffect = v
    return this
  }

  setPortal(b: any) {
    this.portal = b
    return this
  }

  private useHelper() {
    const helper: DomHelper<T> = useMemo(DomHelper.create, this.type)
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

  renderOrText(fun?: DomTextOrFunNode<T>) {
    const tp = typeof fun
    if (tp == 'function') {
      return this.render(fun as any)
    } else if (tp == 'string' || tp == 'number' || fun) {
      return this.renderTextContent(fun + '')
    }
    return this.render()
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
    (props?: DomAttribute<key> | DomAttributeSO<key>, isPortal?: boolean): DomCreater<key>
    (fun: (v: DomAttributeS<key>) => DomAttributeS<key> | void, isPortal?: boolean): DomCreater<key>
  }
}
if ('Proxy' in globalThis) {
  const cacheDomMap = new Map<string, any>()
  dom = new Proxy(emptyObject as any, {
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