import { render, MemoEvent, EffectEvent, EffectDestroyEvent, renderFiber, FiberConfig } from "better-react";
import { DomAttribute, DomElement, DomElementType, SvgAttribute, SvgElement, SvgElementType } from "./html";
import { AskNextTimeWork, arrayNotEqualDepsWithEmpty, emptyArray } from "wy-helper";
import { useAttrEffect, useBeforeAttrEffect, useMemo, useOneAttrEffect } from "better-react-helper";
import { hookAddResult } from "better-react";
import { domTagNames, svgTagNames, useUpdateDomNodeAttr } from "./updateDom";
import { allowAddAnyNode, createUseAfterRender } from "./util";
export { isSVG, useUpdateDomNodeAttr, useUpdateSvgNodeAttr } from './updateDom'
export { getAliasOfAttribute, getAttributeAlias } from './getAttributeAlias'
export * from './html'
export * from './dom'
export * from './canvas'
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
export function createRoot(node: Node, reconcile: () => void, getAsk: AskNextTimeWork) {
  return render(
    {
      allowFiber: true,
      allowAdd: allowAddAnyNode,
      useAfterRender: createUseAfterRender(node)
    },
    reconcile,
    getAsk
  )
}






function creatTextContent() {
  return document.createTextNode("")
}


export function createTextNode() {
  return useMemo(creatTextContent)
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
export function renderContent(content: string) {
  const node = useMemo(creatTextContent)
  hookAddResult(node)
  useOneAttrEffect((e) => {
    node.textContent = e.trigger
  }, content)
}






