import { BDomEvent, DomElement, DomElementType, FChildAttr, FDomAttribute, mergeFNodeAttr, WithCenterMap } from "wy-dom-helper";
import { emptyArray, emptyObject } from "wy-helper";
import { hookAddResult, hookBeginTempOps, hookEndTempOps } from "better-react";
import { NodeMemoCreater } from "./node";
import { hookAttrEffect, useAttrEffect, useMemo } from "better-react-helper";
import { NodeHelper } from "./helper";


const domCreater: NodeMemoCreater<any, any, any> = (e) => {
  return new NodeHelper(document.createElement(e.trigger), "dom", mergeFNodeAttr)
}
export function renderDom<T extends DomElementType>(
  type: T,
  args: WithCenterMap<FDomAttribute<T>>
    & BDomEvent<T>
    & FChildAttr<DomElement<T>> = emptyObject as any) {
  const helper = useMemo(domCreater, type)
  hookAddResult(helper.node)
  hookAttrEffect(() => {
    helper.updateAttrs(args)
  })
  useAttrEffect(() => {
    return () => {
      helper.destroy()
    }
  }, emptyArray)

  if (args.childrenType == 'html') {
    hookAttrEffect(() => {
      helper.updateContent("html", args.children)
    })
  } else if (args.childrenType == 'text') {
    hookAttrEffect(() => {
      helper.updateContent("text", args.children)
    })
  } else if (args.children) {
    const tempOps = helper.getTempOps()
    const before = hookBeginTempOps(tempOps)
    args.children(helper.node)
    hookEndTempOps(before!)
  }

  return helper.node
}