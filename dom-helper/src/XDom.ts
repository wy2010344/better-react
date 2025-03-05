import { BDomEvent, BSvgEvent, DomElementType, domTagNames, mergeXDomAttr, mergeXSvgAttr, SvgElementType, svgTagNames, WithCenterMap, XDomAttribute, XSvgAttribute } from "wy-dom-helper";
import { createOrProxy, emptyArray, emptyObject } from "wy-helper";
import { Better } from "./tsxSupport";
import { hookAttrEffect, useAttrEffect, useMemo } from "better-react-helper";
import { hookAddResult } from "better-react";
import { NodeHelper, NodeMemoCreater } from "better-react-dom";







function create(tagNames: string[], creater: NodeMemoCreater<any, any, any>) {
  return createOrProxy(tagNames, function (tag) {
    return function (args: any = emptyObject) {
      const helper = useMemo(creater, tag)
      hookAddResult(helper.node)
      hookAttrEffect(() => {
        helper.updateAttrs(args)
      })
      useAttrEffect(() => {
        return () => {
          helper.destroy()
        }
      }, emptyArray)

      return args.children
    }
  }) as any
}

const ignoreKeys = ['ref']
export const Dom: {
  readonly [key in DomElementType]: {
    (
      args?: WithCenterMap<XDomAttribute<key>>
        & BDomEvent<key>
        & {
          children?: Better.ChildrenElement
        }): Better.Element
  }
} = create(domTagNames, (e) => {
  return new NodeHelper(document.createElement(e.trigger), mergeXDomAttr, ignoreKeys)
})

export const Svg: {
  readonly [key in SvgElementType]: {
    (
      args?: WithCenterMap<XSvgAttribute<key>>
        & BSvgEvent<key>
        & {
          children?: Better.ChildrenElement
        }): Better.Element
  }
} = create(svgTagNames, e => {
  return new NodeHelper(document.createElement(e.trigger), mergeXSvgAttr, ignoreKeys)
})