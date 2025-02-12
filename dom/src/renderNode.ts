import { BDomEvent, BSvgEvent, DomElement, DomElementType, domTagNames, FDomAttribute, FGetChildAttr, FSvgAttribute, mergeFNodeAttr, SvgElement, SvgElementType, svgTagNames, WithCenterMap } from "wy-dom-helper";
import { emptyArray, emptyObject, SetValue, SyncFun, createOrProxy } from "wy-helper";
import { hookAddResult, hookBeginTempOps, hookEndTempOps } from "better-react";
import { NodeMemoCreater } from "./node";
import { hookAttrEffect, useAttrEffect, useMemo } from "better-react-helper";
import { NodeHelper } from "./helper";


const domCreater: NodeMemoCreater<any, any, any> = (e) => {
  return new NodeHelper(document.createElement(e.trigger), "dom", mergeFNodeAttr)
}
const svgCreater: NodeMemoCreater<any, any, any> = (e) => {
  return new NodeHelper(document.createElementNS("http://www.w3.org/2000/svg", e.trigger), "svg", mergeFNodeAttr)
}
type SyncOrFun<T> = T | SyncFun<T>

type FChildAttr<T> = {
  childrenType: "text";
  children: SyncOrFun<number | string>;
} | {
  childrenType: "html";
  children: SyncOrFun<number | string>;
} | {
  childrenType?: never;
  children?: SetValue<T>;
};

function renderHelper(helper: NodeHelper<any, any>, args: FChildAttr<any>) {
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

export type FDomAttributes<T extends DomElementType> = WithCenterMap<FDomAttribute<T>>
  & BDomEvent<T>
  & FChildAttr<DomElement<T>>
export function renderDom<T extends DomElementType>(
  type: T,
  args: FDomAttributes<T> = emptyObject as any) {
  const helper = useMemo(domCreater, type)
  return renderHelper(helper, args)
}

export type FSvgAttributes<T extends SvgElementType> = WithCenterMap<FSvgAttribute<T>>
  & BSvgEvent<T>
  & FChildAttr<SvgElement<T>>
export function renderSvg<T extends SvgElementType>(
  type: T,
  args: FSvgAttributes<T> = emptyObject as any) {
  const helper = useMemo(svgCreater, type)
  return renderHelper(helper, args)
}

export const fdom: {
  readonly [key in DomElementType]: {
    (props?: FDomAttributes<key>): DomElement<key>
  }
} = createOrProxy(domTagNames, tag => {
  return function (args: any) {
    return renderDom(tag, args)
  } as any
})

export const fsvg: {
  readonly [key in SvgElementType]: {
    (props?: FSvgAttributes<key>): SvgElement<key>
  }
} = createOrProxy(svgTagNames, tag => {
  return function (args: any) {
    return renderSvg(tag, args)
  } as any
})