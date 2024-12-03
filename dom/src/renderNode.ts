import { BDomEvent, DomElement, DomElementType, FChildAttr, FDomAttribute, WithCenterMap } from "wy-dom-helper";
import { emptyObject } from "wy-helper";
import { useDomNode } from "./dom";
import { hookAddResult } from "better-react";
import { Creater } from "./node";
import { useMemo } from "better-react-helper";
import { NodeHelper } from "./helper";



function updateProps(node: Node, key: string, value?: any) {

}

const domCreater: Creater<any, any, any> = (e) => {
  return new NodeHelper(document.createElement(e.trigger), updateDomProps)
}
export function renderDom<T extends DomElementType>(
  type: T,
  args: WithCenterMap<FDomAttribute<T>>
    & BDomEvent<T>
    & FChildAttr<DomElement<T>> = emptyObject as any) {
  const heler = useMemo(domCreater, type)
  hookAddResult(heler.node)

}