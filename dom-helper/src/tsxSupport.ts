import { dom, svg, renderContent } from "better-react-dom"
import { renderArray, renderFragment, useAttrEffect, useImperativeHandle } from "better-react-helper"
import { isSVG } from "wy-dom-helper"
import { arrayMapCreater, emptyArray, emptyFun, GetValue, SyncFun, trackSignal } from "wy-helper"
/**
 
 使用方式:

在tsconfig.json里添加:

"jsx": "preserve",
"jsxFactory": "Better.createElement",
"jsxFragmentFactory": "Better.Fragment",

即在新建的tsx文件里需要导入
import { Better } from "better-react-dom-helper";


在vite-env.d.ts里面添加:

declare namespace JSX {
  type IntrinsicElements = import("better-react-dom-helper").Better.IntrinsicElements
  type Element = import("better-react-dom-helper").Better.Element
  type ElementChildrenAttribute = import("better-react-dom-helper").Better.ElementChildrenAttribute
}

最终接受的JSX.Element:
使用Better.renderChild(...)来hook到fiber上去
 */


type ConvertMapToUnion<T> = {
  [K in keyof T]: { type: K; props?: T[K] };
}[keyof T];





type FC<T> = (arg: T & {}) => BElement

type NodeElement<T = Record<string, any>> = {
  type: FC<T>
  props: T
} | ConvertMapToUnion<Better.IntrinsicElements>

//tsx需要的类型
type BElement = NodeElement | null | undefined | string | boolean | number | SyncFun<number | string | boolean>

export namespace Better {
  type WithChildren<K> = {
    ref?: {
      current: K | null
    }
    key?: any
    children?: ChildrenElement
  }
  export type ChildrenElement = BElement | ChildrenElement[];

  export type IntrinsicElements = {
    [key in import("wy-dom-helper").DomElementType]: import("wy-dom-helper").DomAttributeSO<key> & WithChildren<import("wy-dom-helper").DomElement<key>>
  } & {
    [key in import("wy-dom-helper").SvgElementType]: import("wy-dom-helper").SvgAttributeSO<key> & WithChildren<import("wy-dom-helper").SvgElement<key>>
  }
  export type Element = BElement
  /**
   * 约束默认的children类型
   */
  export interface ElementChildrenAttribute {
    children?: ChildrenElement // specify children name to use
  }
}

function setText(c: any, node: any) {

  if (c) {
    node.textContent = c + ''
    return
  } else {
    if (typeof c == 'number') {
      node.textContent = c + ''
      return
    }
  }
  node.textContent = ''
}
function renderChild(child: Better.ChildrenElement) {
  if (Array.isArray(child)) {
    //map类型
    renderChildren(child)
    return
  }

  if (child) {
    const tpc = typeof child
    if (tpc == 'object') {
      //jsx-element
      renderJSX(child)
    } else if (tpc == 'function') {
      const node = renderContent('')
      useAttrEffect(() => {
        return (child as any)(setText, node)
      }, child)
    } else {
      renderContent(child + '')
    }
  } else {
    if (typeof child == 'number') {
      renderContent(child + '')
    }
    //空字符串、false、null、undefined不处理
  }
}
function dynamicGetKey(v: Better.ChildrenElement) {
  if (typeof v == 'object' && v) {
    const m = v as any
    return m?.props?.key
  }
}
function staticGetKey(v: Better.ChildrenElement, i: number) {
  if (typeof v == 'object' && v) {
    const m = v as any
    const key = m.props?.key
    if (key) {
      return [key, m.type]
    }
    return [i, m.type]
  }
  return [i]
}
function renderChildren(children: Better.ChildrenElement) {
  if (Array.isArray(children)) {
    if ((children as any)._queue_) {
      renderArray(children, staticGetKey, renderChild, arrayMapCreater)
    } else {
      renderArray(children, dynamicGetKey, renderChild)
    }
  }
}
/**
 * 这个一般不显式调用
 * @param type 
 * @param props 
 * @param children 
 * @returns 
 */
function createElement(type: any, props: Record<string, any>, ...children: BElement[]) {
  if (!props) {
    props = {}
  }
  (children as any)._queue_ = true
  props.children = children
  return {
    type,
    props
  }
}
export const Better = {
  renderChild,
  createElement,
  /**这可能显式调用,当使用key的时候 */
  Fragment(props: {
    key?: any,
    children?: Better.ChildrenElement
  }) {
    let children = props.children
    if (!Array.isArray(children)) {
      children = [children]
    }
    renderChildren(children)
  }
}
function renderJSX({
  type,
  props
}: any) {
  if (typeof type == 'string') {
    renderFragment(() => {
      useImperativeHandle(props.ref || emptyFun, () => node, emptyArray)
      const children = props?.children
      const helper = isSVG(type) ? svg[type as 'svg'](props as any) : dom[type as 'div'](props as any)
      const node = helper.render(() => {
        renderChildren(children)
      })
      if (props.ref) {
        props.ref.current = node
      }
    })
  } else {
    renderFragment(() => {
      const out = type(props)
      renderChild(out)
    })
  }
}