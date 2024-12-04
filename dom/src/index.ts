import { hookAddResult, render } from "better-react";
import { AskNextTimeWork, emptyArray, emptyFun, EmptyFun, genTemplateStringS1, SyncFun, VType } from "wy-helper";
import { hookAttrEffect, useAttrEffect, useMemo } from "better-react-helper";
import { createNodeTempOps } from "./util";
import { isSyncFun } from "wy-dom-helper";
export { renderPortal } from './node';
export type { NodeMemoCreater } from './node';
export * from './dom'
export * from './svg'
export * from './util'
export * from './renderNode'
export { NodeHelper } from './helper'
/***
 * 先声明dom节点再装入use配置参数,以实现dom节点复用?
 * 目前无需求.
 * 比如移动,其实一些dom状态会丢失,如scrollTop
 * 可能有一些三方组件的封装,配置参数却需要自定义,而不是dom参数
 * 这个事件提供的node节点是会被销毁的——可以不限制是svg或dom
 * updateProps虽然只处理dom,事实上永远不会起作用
 * FiberNode.create(node, updateProps, true),
 */
export function createRoot(
  node: Node,
  reconcile: EmptyFun,
  getAsk: AskNextTimeWork) {
  return render(
    createChangeAtom => createNodeTempOps(node, createChangeAtom),
    reconcile,
    getAsk
  )
}






function creatTextContent() {
  return document.createTextNode("")
}


export function createTextNode() {
  return useMemo(creatTextContent, emptyArray)
}

export function useTextContent(node: Node, value: string) {
  useAttrEffect(() => {
    node.textContent = value
  }, [node, value])
}

function createFun() {
  return new FunNode()
}


function updateContent(value: string, node: Text) {
  node.textContent = value
}
class FunNode {
  readonly node = creatTextContent()

  public destroy = emptyFun
  private lastContent: string | SyncFun<string> = ''
  updateContent(content: string | SyncFun<string>) {
    if (content == this.lastContent) {
      return
    }
    this.lastContent = content
    this.destroy()
    if (isSyncFun(content)) {
      this.destroy = content(updateContent, this.node)
    } else {
      this.destroy = emptyFun
      updateContent(content, this.node)
    }
  }
}
/**
 * [FiberText.create, content]
 * @param content 
 * @returns 
 */
export function renderTextContent(content: string | SyncFun<string>) {
  const node = useMemo(createFun, emptyArray)
  hookAttrEffect(() => {
    node.updateContent(content)
  })
  useAttrEffect((e) => {
    return () => {
      node.destroy()
    }
  }, emptyArray)
  hookAddResult(node.node)
  return node.node
}

export function renderContent(content: string) {
  const node = useMemo(creatTextContent, emptyArray)
  useAttrEffect((e) => {
    node.textContent = content
  }, content)
  hookAddResult(node)
  return node
}

export function renderText(ts: TemplateStringsArray, ...vs: (number | string)[]) {
  return renderContent(genTemplateStringS1(ts, vs))
}

export type TextOrFunNode = string | boolean | number | null | EmptyFun

export function renderFunOrText(render?: TextOrFunNode) {
  const tp = typeof render
  if (tp == 'function') {
    return (render as any)()
  } else if (tp == 'string' || tp == 'number' || render) {
    return renderContent(render + '')
  }
}




