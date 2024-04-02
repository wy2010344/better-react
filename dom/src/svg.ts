import { MemoEvent } from "better-react"
import { SvgAttribute, SvgElement, SvgElementType } from "./html"
import { useMemo } from "better-react-helper"
import { updateDom } from "./updateDom"
import { emptyObject } from "wy-helper"
import { updateProps } from "./dom"
import { getAttributeAlias } from "./getAttributeAlias"


function createUpdateSvg<T extends SvgElementType>(e: MemoEvent<SvgElement<T>>) {
  let oldAttrs: SvgAttribute<T> = emptyObject
  return function (attrs: SvgAttribute<T>) {
    updateDom(e.trigger, updateSVGProps, attrs, oldAttrs)
    oldAttrs = attrs
  }
}



function updateSVGProps(node: any, key: string, value?: any) {
  if (key == 'innerHTML' || key == 'textContent') {
    updateProps(node, key, value)
  } else {
    if (value) {
      if (key == 'className') {
        key = 'class'
      }
      key = getAttributeAlias(key)
      node.setAttribute(key, value)
    } else {
      node.removeAttribute(key)
    }
  }
}

export function useUpdateSvgNodeAttr<T extends SvgElementType>(
  node: SvgElement<T>
) {
  return useMemo(createUpdateSvg, node)
}

export function createSvgElement(e: MemoEvent<string>) {
  return document.createElementNS("http://www.w3.org/2000/svg", e.trigger)
}
export function useSvgNode<T extends SvgElementType>(
  type: T
): SvgElement<T> {
  return useMemo(createSvgElement, type)
}

