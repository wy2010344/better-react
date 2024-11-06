import { hookAttrEffect, useAttrEffect, useEffect, useMemo } from "better-react-helper"
import { ListCreater, TOrQuote, createNodeTempOps, lazyOrInit, } from "./util"
import { EffectEvent, MemoEvent, TempOps, hookAddResult, hookBeginTempOps, hookCreateChangeAtom, hookEndTempOps } from "better-react"
import { DomAttribute, DomAttributeS, DomAttributeSO, DomElement, DomElementType } from "wy-dom-helper"
import { emptyArray, emptyFun, emptyObject, genTemplateStringS2, trackSignal, VType } from "wy-helper"
import { domTagNames, updateDom } from "wy-dom-helper"
import { Creater, NodeCreater, NodeHelper } from "./node"

export function createDomElement(e: MemoEvent<Node, string>) {
  return document.createElement(e.trigger)
}
export function useDomNode<T extends DomElementType>(
  type: T
): DomElement<T> {
  return useMemo(createDomElement, type)
}

const emptyKeys = ['href', 'className']
export function updateDomProps(node: any, key: string, value?: any) {
  if (key.includes('-')) {
    node.setAttribute(key, value)
  } else {
    if (emptyKeys.includes(key) && !value) {
      node[key] = ''
    } else {
      node[key] = value
    }
  }
}

type DomNodeCreater<T extends DomElementType> = NodeCreater<T, DomElement<T>, DomAttribute<T> | DomAttributeSO<T>>


const domCreater: Creater<any, any, any> = (e) => {
  return new NodeHelper(document.createElement(e.trigger), updateDomProps)
}

let dom: {
  readonly [key in DomElementType]: {
    (props?: DomAttribute<key> | DomAttributeSO<key>, isPortal?: boolean): DomNodeCreater<key>
    (fun: (v: DomAttributeS<key>) => DomAttributeS<key> | void, isPortal?: boolean): DomNodeCreater<key>
  }
}
if ('Proxy' in globalThis) {
  const cacheDomMap = new Map<string, any>()
  dom = new Proxy(emptyObject as any, {
    get(_target, p, _receiver) {
      const oldV = cacheDomMap.get(p as any)
      if (oldV) {
        return oldV
      }
      const newV = function (args: any, isPortal: any) {
        const creater = NodeCreater.instance
        creater.type = p
        creater.creater = domCreater

        creater.attrsEffect = args
        creater.portal = isPortal
        return creater
      }
      cacheDomMap.set(p as any, newV)
      return newV
    }
  })
} else {
  const cacheDom = {} as any
  dom = cacheDom
  domTagNames.forEach(function (tag) {
    cacheDom[tag] = function (args: any, isPortal: any) {
      const creater = NodeCreater.instance
      creater.type = tag
      creater.creater = domCreater

      creater.attrsEffect = args
      creater.portal = isPortal
      return creater
    }
  })
}

export {
  dom
}