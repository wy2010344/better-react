import {
  FindParentAndBefore,
  VirtaulDomNode, useLevelEffect
} from "better-react"
import { getAttributeAlias } from "./getAttributeAlias"
import { DomElementType, SvgElementType } from "./html"
import { objectDiffDeleteKey } from "wy-helper"

export type Props = { [key: string]: any }
interface FiberAbsNode<T = any> extends VirtaulDomNode<T> {
  node: Node
}
export const EMPTYPROPS = {}
export type GetValueWithDep<T, F extends readonly any[] = any[]> = readonly [(vs: F) => T, F] | readonly [() => T]
export class FiberNode implements FiberAbsNode<GetValueWithDep<Props>> {
  private constructor(
    public node: Node,
    private _updateProp: (node: Node, key: string, value: any) => void,
    public readonly isPortal?: boolean,
  ) { }
  private updateDomEffect() {
    updateDom(this, this.props, this.oldProps)
    this.oldProps = this.props
  }
  //这个props不需要AtomValue,因为在运行时不访问
  private props: Props = EMPTYPROPS
  private oldProps: Props = EMPTYPROPS
  useUpdate([getProps, deps]: GetValueWithDep<Props>, isFirst: boolean): void {
    const that = this
    useLevelEffect(0, function (deps: any, isInit: boolean) {
      that.props = getProps(deps)
      that.updateDomEffect()
      return that.props.onDestroy
    }, deps as any[])
  }
  static create(
    node: Node,
    updateProps: (node: Node, key: string, value: any) => void,
    isPortal?: boolean,
  ) {
    return new FiberNode(
      node,
      updateProps,
      isPortal
    )
  }
  static createDomWith(node: Node, isPortal?: boolean) {
    return new FiberNode(node, updateProps, isPortal)
  }
  static createDom<T extends DomElementType>(type: T, isPortal?: boolean) {
    return FiberNode.createDomWith(
      document.createElement(type),
      isPortal
    )
  }
  static portalCreateDom<T extends DomElementType>(type: T) {
    return FiberNode.createDom(type, true)
  }
  static createSvgWith(node: Node, isPortal?: boolean) {
    return new FiberNode(
      node,
      updateSVGProps,
      isPortal
    )
  }
  static createSvg<T extends SvgElementType>(type: T, isPortal?: boolean) {
    return FiberNode.createSvgWith(
      document.createElementNS("http://www.w3.org/2000/svg", type),
      isPortal
    )
  }
  static portalCreateSvg<T extends SvgElementType>(type: T) {
    return FiberNode.createSvg(type, true)
  }
  appendAfter(value?: FindParentAndBefore): void {
    appendAfter(this, value as any)
  }
  destroy(): void {
    if (this.isPortal) {
      this.removeFromParent()
    }
  }

  removeFromParent() {
    const props = this.props
    if (props.exit) {
      props.exit(this.node, props).then(() => {
        realRemove(this.node)
      })
    } else {
      realRemove(this.node)
    }
  }

  updateProp(key: string, value: any) {
    this._updateProp(this.node, key, value)
  }
}

function realRemove(node: Node) {
  node.parentElement?.removeChild(node)
}

export class FiberText implements FiberAbsNode {
  public node: Node = document.createTextNode("")
  static create() {
    return new FiberText()
  }
  appendAsPortal(): void {

  }
  useUpdate(content: string) {
    if (this.oldContent != content) {
      this.node.textContent = content
      this.oldContent = content
    }
  }
  private oldContent: string = ""
  appendAfter(value: FindParentAndBefore): void {
    appendAfter(this, value as any)
  }
  removeFromParent(): void {
    this.node.parentElement?.removeChild(this.node)
  }
  destroy(): void {
  }
}
export const emptyFun = () => { }


function mergeEvent(node: Node, key: string, oldValue: any, newValue?: any) {
  let eventType = key.toLowerCase().substring(2)
  let capture = false
  if (eventType.endsWith(Capture)) {
    eventType = eventType.slice(0, eventType.length - Capture.length)
    capture = true
  }
  if (newValue) {
    if (oldValue) {
      node.removeEventListener(eventType, oldValue, capture)
    }
    node.addEventListener(eventType, newValue, capture)
  } else {
    node.removeEventListener(eventType, oldValue, capture)
  }
}
/**
 * 更新节点
 * @param dom 
 * @param oldProps 
 * @param props 
 */
function updateDom(
  dom: FiberNode,
  props: Props,
  oldProps: Props
) {
  const node = dom.node
  //移除旧事件：新属性中不存在相应事件，或者事件不一样
  objectDiffDeleteKey(oldProps, props, function (key: string) {
    if (isEvent(key)) {
      mergeEvent(node, key, oldProps[key])
    } else if (isProperty(key)) {
      dom.updateProp(key, undefined)
    }
  })

  for (const key in props) {
    const value = props[key]
    const oldValue = oldProps[key]
    if (value != oldValue) {
      if (isEvent(key)) {
        mergeEvent(node, key, oldValue, value)
      } else if (isProperty(key)) {
        dom.updateProp(key, value)
      }
    }
  }
}



const Capture = "capture"

/**
 * 是否是事件
 * @param key 
 * @returns 
 */
function isEvent(key: string) {
  return key.startsWith("on")
}
/**
 * 是否是属性，非child且非事件
 * @param key 
 * @returns 
 */
function isProperty(key: string) {
  return key != 'children'
    && key != 'exit'
    && key != 'onDestroy'
}

const emptyKeys = ['href', 'className']
export function updateProps(node: any, key: string, value: any) {
  if (key.includes('-')) {
    node.setAttribute(key, value)
  } else {
    if (emptyKeys.includes(key) && !value) {
      node.removeAttribute(key)
    } else {
      node[key] = value
    }
  }
}


export function updateSVGProps(node: any, key: string, value: any) {
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
/**
 * 调整、追加节点
 * @param parent 
 * @param dom 
 * @param before 
 */
export function appendAfter(dom: FiberAbsNode, parentAndBefore: [FiberAbsNode, FiberAbsNode | null] | [FiberAbsNode | null, FiberAbsNode]) {
  const [parent, before] = parentAndBefore

  const parentDom = parent ? parent.node : before?.node.parentNode
  if (parentDom) {
    const beforeNode = before?.node
    if (beforeNode) {
      //如果有前节点
      const nextNode = beforeNode.nextSibling
      if (nextNode) {
        //如果有后继节点,且后继不为自身
        if (nextNode != dom.node) {
          //console.log("next-insert-before", dom.node, nextNode)
          parentDom.insertBefore(dom.node, nextNode)
        }
      } else {
        //如果没有后继节点,直接尾随
        //console.log("next-append", dom.node)
        parentDom.appendChild(dom.node)
      }
    } else {
      //如果没有前继节点
      const firstChild = parentDom.firstChild
      if (firstChild) {
        //父元素有子元素,
        if (firstChild != dom.node) {
          //console.log("first-insert-before", dom.node, firstChild)
          parentDom.insertBefore(dom.node, firstChild)
        }
      } else {
        //父元素无子元素,直接尾随
        //console.log("first-append", dom.node)
        parentDom.appendChild(dom.node)
      }
    }
  } else {
    console.error("未找到parent-dom????")
  }
}

export function isSVG(name: string) {
  return svgTagNames.includes(name as any)
}
export const svgTagNames: SvgElementType[] = [
  "svg",
  "animate",
  "animateMotion",
  "animateTransform",
  "circle",
  "clipPath",
  "defs",
  "desc",
  "ellipse",
  "feBlend",
  "feColorMatrix",
  "feComponentTransfer",
  "feComposite",
  "feConvolveMatrix",
  "feDiffuseLighting",
  "feDisplacementMap",
  "feDistantLight",
  "feDropShadow",
  "feFlood",
  "feFuncA",
  "feFuncB",
  "feFuncG",
  "feFuncR",
  "feGaussianBlur",
  "feImage",
  "feMerge",
  "feMergeNode",
  "feMorphology",
  "feOffset",
  "fePointLight",
  "feSpecularLighting",
  "feSpotLight",
  "feTile",
  "feTurbulence",
  "filter",
  "foreignObject",
  "g",
  "image",
  "line",
  "linearGradient",
  "marker",
  "mask",
  "metadata",
  "mpath",
  "path",
  "pattern",
  "polygon",
  "polyline",
  "radialGradient",
  "rect",
  "stop",
  "switch",
  "symbol",
  "text",
  "textPath",
  "tspan",
  "use",
  "view"
]

export const domTagNames: DomElementType[] = [
  "a",
  "abbr",
  "address",
  "area",
  "article",
  "aside",
  "audio",
  "b",
  "base",
  "bdi",
  "bdo",
  "big",
  "blockquote",
  "body",
  "br",
  "button",
  "canvas",
  "caption",
  "cite",
  "code",
  "col",
  "colgroup",
  "data",
  "datalist",
  "dd",
  "del",
  "details",
  "dfn",
  "dialog",
  "div",
  "dl",
  "dt",
  "em",
  "embed",
  "fieldset",
  "figcaption",
  "figure",
  "footer",
  "form",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "head",
  "header",
  "hgroup",
  "hr",
  "html",
  "i",
  "iframe",
  "img",
  "input",
  "ins",
  "kbd",
  "keygen",
  "label",
  "legend",
  "li",
  "link",
  "main",
  "map",
  "mark",
  "menu",
  "menuitem",
  "meta",
  "meter",
  "nav",
  "noindex",
  "noscript",
  "object",
  "ol",
  "optgroup",
  "option",
  "output",
  "p",
  "param",
  "picture",
  "pre",
  "progress",
  "q",
  "rp",
  "rt",
  "ruby",
  "s",
  "samp",
  "slot",
  "script",
  "section",
  "select",
  "small",
  "source",
  "span",
  "strong",
  "style",
  "sub",
  "summary",
  "sup",
  "table",
  "template",
  "tbody",
  "td",
  "textarea",
  "tfoot",
  "th",
  "thead",
  "time",
  "title",
  "tr",
  "track",
  "u",
  "ul",
  "var",
  "video",
  "wbr",
  "webview"
]