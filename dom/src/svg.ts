import { MemoEvent } from "better-react"
import { SvgAttribute, SvgAttributeS, SvgAttributeSO, SvgElement, SvgElementType } from "wy-dom-helper"
import { useMemo } from "better-react-helper"
import { createOrProxy } from "wy-helper"
import { updateDomProps } from "./dom"
import { getAttributeAlias } from "wy-dom-helper"
import { svgTagNames } from "wy-dom-helper"
import { Creater, NodeCreater } from "./node"
import { NodeHelper, updateDomAttrs } from "./helper"

export function updateSVGProps(node: any, key: string, value?: any) {
  if (key == 'innerHTML' || key == 'textContent') {
    updateDomProps(node, key, value)
  } else {
    if (key == 'className') {
      node.setAttribute('class', value || '')
    } else {
      key = getAttributeAlias(key)
      if (value) {
        node.setAttribute(key, value)
      } else {
        node.removeAttribute(key)
      }
    }
  }
}

export function createSvgElement(e: MemoEvent<Node, string>) {
  return document.createElementNS("http://www.w3.org/2000/svg", e.trigger)
}
export function useSvgNode<T extends SvgElementType>(
  type: T
): SvgElement<T> {
  return useMemo(createSvgElement, type)
}



export type SvgTextOrFunNode<T extends SvgElementType> = string | number | boolean | null | ((v: SvgElement<T>) => void)

const updateAttr = updateDomAttrs(updateSVGProps)
const svgCreater: Creater<any, any, any> = e => {
  return new NodeHelper(
    document.createElementNS("http://www.w3.org/2000/svg", e.trigger),
    updateAttr)
}
type SvgNodeCreater<T extends SvgElementType> = NodeCreater<T, SvgElement<T>, SvgAttribute<T> | SvgAttributeSO<T>>


export const svg: {
  readonly [key in SvgElementType]: {
    (props?: SvgAttribute<key> | SvgAttributeSO<key>): SvgNodeCreater<key>
    (fun: (v: SvgAttributeS<key>) => SvgAttributeS<key> | void): SvgNodeCreater<key>
  }
} = createOrProxy(svgTagNames, tag => {
  return function (args: any) {

    const creater = NodeCreater.instance
    creater.type = tag
    creater.creater = svgCreater

    creater.attrsEffect = args
    return creater
  }
})