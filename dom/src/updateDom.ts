import {
  FindParentAndBefore,
  Props, VirtaulDomNode, createContext
} from "better-react"
import { SvgElements } from "./html"
import { getAttributeAlias } from "./getAttributeAlias"

/**
 * 这只是一种dom的更新css方式,将css属性交给外部处理
 * 如果是自定义的其它dom元素,应该内置着css处理
 */
export type StyleNode = {
  className: string
  update(css: string): void
  destroy(): void
}
export type CreateStyleNode = () => StyleNode
const DefaultStyleCreater: CreateStyleNode = () => {
  return {
    className: "un expected",
    update() {
      throw `un expected`
    },
    destroy() {
      throw `un expected`
    }
  }
}
export const StyleContext = createContext<CreateStyleNode>(DefaultStyleCreater)

interface FiberAbsNode<T = any> extends VirtaulDomNode<T> {
  node: Node
}
// const INPUTS = ["input", "textarea", "select"]
export class FiberNode<F> implements FiberAbsNode<F> {
  init() { }
  private constructor(
    public node: Node,
    private getProps: (v: F) => Props,
    private _updateProp: (node: Node, key: string, value: any) => void,
  ) { }
  create(props: F): void {
    this.update(props)
  }
  private props: Props = {}
  private createStyle: CreateStyleNode = DefaultStyleCreater
  reconcile(): void {
    this.createStyle = this.findStyleCreate()
  }
  private findStyleCreate() {
    return StyleContext.useConsumer()
  }
  static create<F>(
    node: Node,
    getProps: (v: F) => Props,
    updateProps: (node: Node, key: string, value: any) => void = updatePorps
  ) {
    return new FiberNode(
      node,
      getProps,
      updateProps
    )
  }
  static createDom<F>(type: string, getProps: (v: F) => Props) {
    const create = () => document.createElement(type)
    return function () {
      return new FiberNode(
        create(),
        getProps,
        updatePorps
      )
    }
  }
  static createSvg<T>(type: string, getProps: (v: T) => Props) {
    const create = () => document.createElementNS("http://www.w3.org/2000/svg", type)
    return function () {
      return new FiberNode(
        create(),
        getProps,
        updateSVGProps
      )
    }
  }
  isPortal(props: F): boolean {
    return this.getProps(props).portalTarget
  }
  appendAsPortal(): void {
    const parent = this.props.portalTarget()
    if (parent) {
      if (parent != this.node.parentNode) {
        parent.appendChild(this.node)
      }
    } else {
      console.warn('no parent get', this.props)
    }
  }
  appendAfter(value?: FindParentAndBefore): void {
    appendAfter(this, value as any)
  }
  destroy(): void {
    if (this.style) {
      this.style.destroy()
    }
  }
  /**
   * 属性更新
   * @param props 
   */
  update(v: F) {
    const newProps = this.getProps(v)
    updateDom(this,
      newProps,
      this.props,
      this.createStyle
    )
    this.props = newProps
  }
  private realRemove() {
    this.node.parentElement?.removeChild(this.node)
  }

  removeFromParent() {
    if (this.props?.exit) {
      const that = this
      this.props.exit(this.node).then(() => {
        that.realRemove()
      })
    } else {
      this.realRemove()
    }
  }
  style?: StyleNode

  updateProp(key: string, value: any) {
    this._updateProp(this.node, key, value)
  }
}


export class FiberText implements FiberAbsNode<string>{
  public node: Node = document.createTextNode("")
  static create() {
    return new FiberText()
  }
  private content: string = ""
  create(props: string): void {
    this.update(props)
  }
  update(props: string): void {
    if (props != this.content) {
      this.node.textContent = props
      this.content = props
    }
  }
  init(): void {
  }
  isPortal(): boolean {
    return false
  }
  appendAsPortal(): void {
  }
  appendAfter(value: FindParentAndBefore): void {
    appendAfter(this, value as any)
  }
  removeFromParent(): void {
    this.node.parentElement?.removeChild(this.node)
  }
  destroy(): void {
  }
}

const emptyProps = {}
const emptyFun = () => { }

function purifyStyle(style: object) {
  const s = Object.entries(style).map(function (v) {
    return `${underlineToCamel(v[0])}:${v[1]};`
  }).join("")
  return s
}

export function underlineToCamel(str: string) {
  return str.replace(/\B([A-Z])/g, '-$1').toLowerCase()
}
/**
 * 更新节点
 * @param dom 
 * @param oldProps 
 * @param props 
 */
function updateDom<F>(
  dom: FiberNode<F>,
  props: Props = emptyProps,
  oldProps: Props = emptyProps,
  styleCreater?: CreateStyleNode
) {
  let addClass = ''
  let removeClass = ''
  //先执行全局css可能发生的突变
  if (oldProps.css) {
    if (!dom.style) {
      throw `请传入oldStyle`
    }
    if (props.css) {
      //更新
      if (props.css != oldProps.css) {
        dom.style.update(props.css)
      }
    } else {
      //删除
      dom.style.destroy();
      removeClass = dom.style.className
      dom.style = undefined
    }
  } else {
    if (props.css) {
      //新增
      if (styleCreater) {
        const style = styleCreater()
        style.update(props.css)
        dom.style = style
        addClass = style.className
      } else {
        throw `使用css但没有找到styleCreater`
      }
    }
  }

  const node = dom.node
  //移除旧事件：新属性中不存在相应事件，或者事件不一样
  const prevKeys = Object.keys(oldProps)
  const nextKeys = Object.keys(props)
  const style = props.style
  if (style && typeof (style) == 'object') {
    //转化成字符串。会造成对style的全覆盖，所以不能单独修改元素
    //单独个性style属性,允许驼峰与短线,但是这种化驼峰为短线,比较危险.
    props.style = purifyStyle(style)
  }
  prevKeys
    .filter(isEvent)
    .filter(key => !(key in props) || isNew(oldProps, props)(key))
    .forEach(name => {
      let eventType = name.toLowerCase().substring(2)
      if (eventType.endsWith(Capture)) {
        eventType = eventType.slice(0, eventType.length - Capture.length)
        node.removeEventListener(eventType, oldProps[name], true)
      } else {
        node.removeEventListener(eventType, oldProps[name])
      }
    })
  //移除旧的不存在属性
  prevKeys
    .filter(isProperty)
    .filter(isGone(oldProps, props))
    .forEach(name => dom.updateProp(name, undefined))
  //修改变更属性
  nextKeys
    .filter(isProperty)
    .filter(isNew(oldProps, props))
    .forEach(name => dom.updateProp(name, props[name]))

  //添加变更事件
  nextKeys
    .filter(isEvent)
    .filter(isNew(oldProps, props))
    .forEach(name => {
      let eventType = name.toLowerCase().substring(2)
      if (eventType.endsWith(Capture)) {
        eventType = eventType.slice(0, eventType.length - Capture.length)
        node.addEventListener(eventType, props[name], true)
      } else {
        node.addEventListener(eventType, props[name])
      }
    })

  if (removeClass) {
    (dom.node as HTMLElement).classList.remove(removeClass)
  }
  if (addClass) {
    (dom.node as HTMLElement).classList.add(addClass)
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
  return key != 'children' && key != 'css' && key != 'exit' && !isEvent(key)
}
/**
 * 属性发生变更
 * @param prev 
 * @param next 
 * @returns 
 */
function isNew(prev: Props, next: Props) {
  return function (key: string) {
    return prev[key] != next[key]
  }
}
/**
 * 新属性已经不存在
 * @param prev 
 * @param next 
 * @returns 
 */
function isGone(prev: Props, next: Props) {
  return function (key: string) {
    return !(key in next)
  }
}

export function updatePorps(node: any, key: string, value: any) {
  node[key] = value
}
export function updateSVGProps(node: any, key: string, value: any) {
  if (key == 'innerHTML' || key == 'textContent') {
    updatePorps(node, key, value)
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
export const svgTagNames: (keyof SvgElements)[] = [
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