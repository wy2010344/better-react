import {
  FindParentAndBefore,
  Props, VirtaulDomNode, createContext
} from "better-react"

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
type FiberNodeType = "svg" | "dom"
export class FiberNode implements FiberAbsNode<Props> {
  private constructor(
    public node: Node,
    private _updateProp: (node: Node, key: string, value: any) => void,
    public type: FiberNodeType = 'dom'
  ) { }
  private props: Props = {}
  private createStyle: CreateStyleNode = DefaultStyleCreater
  reconcile(): void {
    this.createStyle = this.findStyleCreate()
  }
  private findStyleCreate() {
    return StyleContext.useConsumer()
  }
  static create(
    node: Node,
    updateProps: (node: Node, key: string, value: any) => void = updatePorps,
    type?: FiberNodeType
  ) {
    return new FiberNode(node, updateProps, type)
  }
  static createFrom(type: string) {
    const svg = isSVG(type)
    const node = svg
      ? this.createDom(type)
      : this.createSvg(type)
    return node
  }
  static createDom(type: string) {
    return FiberNode.create(document.createElement(type))
  }
  static createSvg(type: string) {
    return FiberNode.create(document.createElementNS("http://www.w3.org/2000/svg", type), updateSVGProps, "svg")
  }
  isPortal(): boolean {
    return this.props.portalTarget
  }
  appendAsPortal(): void {
    if (this.isPortal()) {
      const parent = this.props.portalTarget()
      if (parent) {
        parent.appendChild(this.node)
      } else {
        console.warn('no parent get', this.props)
      }
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
  update(props: Props) {
    updateDom(this,
      props,
      this.props,
      this.createStyle
    )
    this.props = props
  }
  init() {
    if (this.props?.ref) {
      this.props.ref(this.node)
    }
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
    if (this.props?.ref) {
      this.props.ref(null)
    }
  }
  style?: StyleNode

  updateProp(key: string, value: any) {
    this._updateProp(this.node, key, value)
  }
}


export class FiberText implements FiberAbsNode<string>{
  private constructor(
    public node: Node
  ) { }
  static create() {
    return new FiberText(document.createTextNode(""))
  }
  private content: string = ""
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


function purifyStyle(style: object) {
  const s = Object.entries(style).map(function (v) {
    return `${underline(v[0])}:${v[1]};`
  }).join("")
  return s
}

function underline(str: string) {
  return str.replace(/\B([A-Z])/g, '-$1').toLowerCase()
}
/**
 * 更新节点
 * @param dom 
 * @param oldProps 
 * @param props 
 */
function updateDom(
  dom: FiberNode,
  props: Props = emptyProps,
  oldProps: Props = emptyProps,
  styleCreater?: () => StyleNode
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
  return key != 'children' && key != 'css' && key != 'ref' && key != 'exit' && !isEvent(key)
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
  if (value) {
    node.setAttribute(key, value)
  } else {
    node.removeAttribute(key)
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
  name = name.toLowerCase()
  return svgTagNames.includes(name)
}
export const svgTagNames = [
  'a',
  'altGlyph',
  'altGlyphDef',
  'altGlyphItem',
  'animate',
  'animateColor',
  'animateMotion',
  'animateTransform',
  'animation',
  'audio',
  //'canvas',
  'circle',
  'clipPath',
  'color-profile',
  'cursor',
  'defs',
  'desc',
  'discard',
  'ellipse',
  'feBlend',
  'feColorMatrix',
  'feComponentTransfer',
  'feComposite',
  'feConvolveMatrix',
  'feDiffuseLighting',
  'feDisplacementMap',
  'feDistantLight',
  'feDropShadow',
  'feFlood',
  'feFuncA',
  'feFuncB',
  'feFuncG',
  'feFuncR',
  'feGaussianBlur',
  'feImage',
  'feMerge',
  'feMergeNode',
  'feMorphology',
  'feOffset',
  'fePointLight',
  'feSpecularLighting',
  'feSpotLight',
  'feTile',
  'feTurbulence',
  'filter',
  'font',
  'font-face',
  'font-face-format',
  'font-face-name',
  'font-face-src',
  'font-face-uri',
  'foreignObject',
  'g',
  'glyph',
  'glyphRef',
  'handler',
  'hkern',
  'iframe',
  'image',
  'line',
  'linearGradient',
  'listener',
  'marker',
  'mask',
  'metadata',
  'missing-glyph',
  'mpath',
  'path',
  'pattern',
  'polygon',
  'polyline',
  'prefetch',
  'radialGradient',
  'rect',
  'script',
  'set',
  'solidColor',
  'stop',
  'style',
  'svg',
  'switch',
  'symbol',
  'tbreak',
  'text',
  'textArea',
  'textPath',
  'title',
  'tref',
  'tspan',
  'unknown',
  'use',
  'video',
  'view',
  'vkern'
]