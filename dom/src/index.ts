import { hookAddResult, render } from "better-react";
import { AskNextTimeWork, emptyArray, EmptyFun, VType } from "wy-helper";
import { useAttrEffect, useMemo } from "better-react-helper";
import { createNodeTempOps } from "./util";
import { updateText, useMerge } from "./node";
export * from './dom'
export * from './svg'
export * from './util'
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

/**
 * [FiberText.create, content]
 * @param content 
 * @returns 
 */
export function renderContent(content: string, asPortal?: boolean) {
  const node = useMemo(creatTextContent, emptyArray)
  useAttrEffect((e) => {
    node.textContent = e.trigger
  }, content)
  if (asPortal) {
    return node
  }
  hookAddResult(node)
  return node
}

function creatTextContent1() {
  return document.createTextNode("")
}
export function renderText(ts: TemplateStringsArray, ...vs: VType[]) {
  const node = useMemo(creatTextContent1, emptyArray)
  useMerge(updateText, ts, vs, node)
  hookAddResult(node)
  return node
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




