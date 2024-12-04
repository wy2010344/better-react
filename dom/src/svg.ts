import { MemoEvent } from "better-react"
import { mergeDomAttr, SvgAttribute, SvgAttributeS, SvgAttributeSO, SvgElement, SvgElementType } from "wy-dom-helper"
import { useMemo } from "better-react-helper"
import { createOrProxy } from "wy-helper"
import { svgTagNames } from "wy-dom-helper"
import { NodeMemoCreater, NodeCreater } from "./node"
import { NodeHelper } from "./helper"

export function createSvgElement(e: MemoEvent<any, string>) {
  return document.createElementNS("http://www.w3.org/2000/svg", e.trigger)
}
export function useSvgNode<T extends SvgElementType>(
  type: T
): SvgElement<T> {
  return useMemo(createSvgElement, type)
}



export type SvgTextOrFunNode<T extends SvgElementType> = string | number | boolean | null | ((v: SvgElement<T>) => void)

const svgCreater: NodeMemoCreater<any, any, any> = e => {
  return new NodeHelper(
    createSvgElement(e),
    "svg",
    mergeDomAttr)
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