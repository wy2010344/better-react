import { useMemo } from "better-react-helper"
import { MemoEvent } from "better-react"
import { DomAttribute, DomAttributeS, DomAttributeSO, DomElement, DomElementType, mergeDomAttr } from "wy-dom-helper"
import { createOrProxy } from "wy-helper"
import { domTagNames } from "wy-dom-helper"
import { NodeMemoCreater, NodeCreater } from "./node"
import { NodeHelper } from "./helper"

export function createDomElement(e: MemoEvent<Node, string>) {
  return document.createElement(e.trigger)
}
export function useDomNode<T extends DomElementType>(
  type: T
): DomElement<T> {
  return useMemo(createDomElement, type)
}

type DomNodeCreater<T extends DomElementType> = NodeCreater<T, DomElement<T>, DomAttribute<T> | DomAttributeSO<T>>

const domCreater: NodeMemoCreater<any, any, any> = (e) => {
  return new NodeHelper(document.createElement(e.trigger), "dom", mergeDomAttr)
}
export const dom: {
  readonly [key in DomElementType]: {
    (props?: DomAttribute<key> | DomAttributeSO<key>): DomNodeCreater<key>
    (fun: (v: DomAttributeS<key>) => DomAttributeS<key> | void): DomNodeCreater<key>
  }
} = createOrProxy(domTagNames, tag => {
  return function (args: any) {
    const creater = NodeCreater.instance
    creater.type = tag
    creater.creater = domCreater

    creater.attrsEffect = args
    return creater
  }
})