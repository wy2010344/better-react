import { EffectEvent, hookAddResult, hookBeginTempOps, hookEndTempOps, hookEnvModel, MemoEvent, TempOps } from "better-react"
import { createNodeTempOps, lazyOrInit, ListCreater, TOrQuote } from "./util"
import { updateDom } from "wy-dom-helper"
import { emptyArray, emptyFun, emptyObject, genTemplateStringS2, trackSignal, VType } from "wy-helper"
import { hookAttrEffect, useAttrEffect, useMemo } from "better-react-helper"



export function updateText(text: string, node: Node) {
  node.textContent = text
}
export function updateHTML(html: string, node: Element) {
  node.innerHTML = html
}

export function useMerge<A>(
  update: (text: string, a: A) => void,
  ts: TemplateStringsArray,
  vs: VType[],
  a: A
): void
export function useMerge(
  update: (text: string) => void,
  ts: TemplateStringsArray,
  vs: VType[]
): void
export function useMerge(
  update: any, ts: any, vs: any
) {
  const a = arguments[3]
  useAttrEffect(() => {
    return trackSignal(() => {
      return genTemplateStringS2(ts, vs)
    }, update, a)
  }, vs)
}


export function useRenderHtml(node: {
  innerHTML: string
}, value: string) {
  useAttrEffect(() => {
    node.innerHTML = value
  }, [node, value])
}

export function destroyOldDes(attrs: Record<string, any>) {
  for (const key in attrs) {
    const value = attrs[key]
    if (value) {
      if (key == 'style') {
        if (typeof value == 'function') {
          value()
        } else {
          for (const subKey in value) {
            value[subKey]?.()
          }
        }
      } else {
        value()
      }
    }
  }
}

export class NodeHelper<T extends Element, Attr extends {}> {
  constructor(
    public readonly node: T,
    private readonly updateProps: (node: Node, key: string, value?: any) => void
  ) { }
  private tempOps!: TempOps<ListCreater>

  private oldDes = {}

  private oldAttrs: any = emptyObject as any
  updateAttrs(attrs: Attr) {
    this.oldDes = updateDom(this.node, this.updateProps, attrs, this.oldAttrs, this.oldDes)
    this.oldAttrs = attrs
  }
  destroy() {
    destroyOldDes(this.oldDes)
  }

  updateHTMLTrigger = (e: EffectEvent<undefined, string>) => {
    this.node.innerHTML = e.trigger
  }

  updateTextTrigger = (e: EffectEvent<undefined, string>) => {
    this.node.textContent = e.trigger
  }

  getTempOps() {
    if (!this.tempOps) {
      this.tempOps = createNodeTempOps(this.node, hookEnvModel().createChangeAtom)
    }
    return this.tempOps
  }
}


export type Creater<K extends string, T extends Element, Attr extends {}> = (e: MemoEvent<NodeHelper<T, Attr>, K>) => NodeHelper<T, Attr>

export class NodeCreater<K extends string, T extends Element, Attr extends {}> {
  static instance = new NodeCreater<any, any, any>()

  public portal?: boolean

  setPortal(b: any) {
    this.portal = b
    return this
  }

  public creater!: (e: MemoEvent<NodeHelper<T, Attr>, K>) => NodeHelper<T, Attr>
  public type!: K

  public attrsEffect: TOrQuote<Attr> = emptyObject as any
  attrs(v: TOrQuote<Attr>) {
    this.attrsEffect = v
    return this
  }

  private useHelper() {
    const helper: NodeHelper<T, Attr> = useMemo(this.creater, this.type)
    const attrsEffect = this.attrsEffect
    this.after(helper)
    hookAttrEffect(() => {
      const attrs = lazyOrInit(attrsEffect)
      helper.updateAttrs(attrs)
    })
    useAttrEffect(() => {
      return () => {
        helper.destroy()
      }
    }, emptyArray)
    return helper
  }

  renderHtml(ts: TemplateStringsArray, ...vs: VType[]) {
    const helper = this.useHelper()
    useMerge(updateHTML, ts, vs, helper.node)
    return helper.node
  }
  renderText(ts: TemplateStringsArray, ...vs: VType[]) {
    const helper = this.useHelper()
    useMerge(updateText, ts, vs, helper.node)
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


  renderOrText(fun?: string | number | boolean | null | ((v: T) => void)) {
    const tp = typeof fun
    if (tp == 'function') {
      return this.render(fun as any)
    } else if (tp == 'string' || tp == 'number' || fun) {
      return this.renderTextContent(fun + '')
    }
    return this.render()
  }

  private after(helper: NodeHelper<T, Attr>) {
    if (!this.portal) {
      hookAddResult(helper.node)
    }
  }
  render(fun: (node: T) => void = emptyFun): T {
    const helper = this.useHelper()
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
    fun(helper.node)
    hookEndTempOps(before!)
    return helper.node
  }


  renderOut<O>(fun: (node: Node) => O): O {
    let out!: O
    this.render(node => {
      out = fun(node)
    })
    return out
  }
}