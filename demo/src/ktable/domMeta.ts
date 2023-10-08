import { EmptyFun, RenderWithDep, emptyArray, useAttrEffect, useBeforeAttrEffect } from "better-react";
import { DomAttribute, DomElement, DomElementType, React, SvgAttribute, SvgElement, SvgElementType, domOf, isSVG, stringifyStyle, svgOf } from "better-react-dom";

type contentEditable = true | "inherit" | "plaintext-only"
export type DomMeta<T extends DomElementType> = {
  ref?(v: DomElement<T>): void
  type: T,
  props?: DomAttribute<T>
} & ({
  childrenType: "render"
  children?: RenderWithDep<any> | EmptyFun
} | {
  childrenType: "text" | "html",
  children?: string
  contentEditable?: contentEditable
})

export type SvgMeta<T extends SvgElementType> = {
  ref?(v: SvgElement<T>): void
  type: T,
  props?: SvgAttribute<T>
} & ({
  childrenType: "render"
  children?: RenderWithDep<any> | EmptyFun
} | {
  childrenType: "text" | "html",
  children?: string
})

export type HTMLType = SvgMeta<any> | DomMeta<any>

function renderWith(a: HTMLType) {
  const type = a.type
  if (isSVG(type)) {
    const b = a as SvgMeta<any>
    const svg = svgOf(type, b.props)
    if (b.childrenType == 'render') {
      if (b.children) {
        if (Array.isArray(b.children)) {
          return svg.render(...b.children)
        } else {
          return svg.render(b.children)
        }
      } else {
        return svg.render()
      }
    } else {
      if (b.children) {
        if (b.childrenType == 'html') {
          return svg.renderInnerHTML(b.children)
        } else {
          return svg.renderTextContent(b.children)
        }
      } else {
        return svg.render()
      }
    }
  } else {
    const b = a as DomMeta<any>
    const dom = domOf(type, b.props)
    if (b.childrenType == 'render') {
      if (b.children) {
        if (Array.isArray(b.children)) {
          return dom.render(...b.children)
        } else {
          return dom.render(b.children)
        }
      } else {
        return dom.render()
      }
    } else {
      if (b.children) {
        if (b.contentEditable) {
          return dom.renderContentEditable(b.contentEditable, b.children, b.childrenType)
        } else {
          if (b.childrenType == 'html') {
            return dom.renderInnerHTML(b.children)
          } else {
            return dom.renderTextContent(b.children)
          }
        }
      } else {
        return dom.render()
      }
    }
  }
}

export function remderHTML(a: HTMLType) {
  const node = renderWith(a)
  useBeforeAttrEffect(() => {
    if (a.ref) {
      a.ref(node)
    }
  }, emptyArray)
}

/**
 * 合并style
 * @param a 
 * @param b 
 * @returns 
 */
export function mergeStyleToStringify(a: undefined | string | React.CSSProperties, b: string | React.CSSProperties) {
  if (a) {
    if (typeof (a) == 'string') {
      if (typeof (b) == 'string') {
        return a + b
      }
      return a + stringifyStyle(b)
    } else {
      if (typeof (b) == 'string') {
        return stringifyStyle(a) + b
      }
      return {
        ...a,
        ...b
      }
    }
  }
  return b
}