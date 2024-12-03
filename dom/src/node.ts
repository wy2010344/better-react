import { EffectEvent, hookAddResult, hookBeginTempOps, hookEndTempOps, hookEnvModel, MemoEvent, TempOps } from "better-react"
import { createNodeTempOps, lazyOrInit, ListCreater, TOrQuote } from "./util"
import { updateDom } from "wy-dom-helper"
import { emptyArray, emptyFun, emptyObject, genTemplateStringS2, SetValue, trackSignal, VType } from "wy-helper"
import { hookAttrEffect, useAttrEffect, useMemo } from "better-react-helper"
import { NodeHelper } from "./helper"



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



export type Creater<K extends string, T extends Element, Attr extends {}> = (e: MemoEvent<NodeHelper<T, Attr>, K>) => NodeHelper<T, Attr>

export class NodeCreater<K extends string, T extends Element, Attr extends {}> {
  static instance = new NodeCreater<any, any, any>()

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
    hookAddResult(helper.node)
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

function createTempOps(e: MemoEvent<TempOps<ListCreater>, Node>) {
  return createNodeTempOps(e.trigger, hookEnvModel().createChangeAtom)
}
/**
 * 指定某节点上挂载
 * @param fun 
 * @param node 
 */
export function renderPortal(fun: SetValue<Node>, node: Node) {
  const tempOps = useMemo(createTempOps, node)
  const before = hookBeginTempOps(tempOps)
  fun(node)
  hookEndTempOps(before!)
}