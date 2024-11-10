import { MemoEvent } from "better-react"
import { SvgAttribute, SvgAttributeS, SvgAttributeSO, SvgElement, SvgElementType } from "wy-dom-helper"
import { useMemo } from "better-react-helper"
import { emptyObject } from "wy-helper"
import { updateDomProps } from "./dom"
import { getAttributeAlias } from "wy-dom-helper"
import { svgTagNames } from "wy-dom-helper"
import { Creater, NodeCreater, NodeHelper } from "./node"

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


const svgCreater: Creater<any, any, any> = e => {
  return new NodeHelper(
    document.createElementNS("http://www.w3.org/2000/svg", e.trigger),
    updateSVGProps)
}
type SvgNodeCreater<T extends SvgElementType> = NodeCreater<T, SvgElement<T>, SvgAttribute<T> | SvgAttributeSO<T>>


let svg: {
  readonly [key in SvgElementType]: {
    (props?: SvgAttribute<key> | SvgAttributeSO<key>): SvgNodeCreater<key>
    (fun: (v: SvgAttributeS<key>) => SvgAttributeS<key> | void): SvgNodeCreater<key>
  }
}
if ('Proxy' in globalThis) {
  const cacheSvgMap = new Map<string, any>()
  svg = new Proxy(emptyObject as any, {
    get(_target, p, _receiver) {
      const oldV = cacheSvgMap.get(p as any)
      if (oldV) {
        return oldV
      }
      const newV = function (args: any) {
        const creater = NodeCreater.instance
        creater.type = p
        creater.creater = svgCreater

        creater.attrsEffect = args
        return creater
      }
      cacheSvgMap.set(p as any, newV)
      return newV
    }
  })
} else {
  const cacheSvg = {} as any
  svg = cacheSvg
  svgTagNames.forEach(function (tag) {
    cacheSvg[tag] = function (args: any) {
      const creater = NodeCreater.instance
      creater.type = tag
      creater.creater = svgCreater

      creater.attrsEffect = args
      return creater
    }
  })
}

export {
  svg
}