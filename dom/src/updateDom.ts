import { createContext, findContext, FindParentAndBefore } from "better-react"
import { Props, VirtaulDomNode } from "better-react"

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
export class FiberNode implements VirtaulDomNode {
  private constructor(
    public node: Node,
    private _updateProp: (node: Node, key: string, value: any) => void,
    private isText?: boolean
  ) {
    this.createStyle = this.findStyleCreate()
  }
  private createStyle: CreateStyleNode
  reconcile(): void {
    this.createStyle = this.findStyleCreate()
  }
  private findStyleCreate() {
    if (this.isText) {
      return DefaultStyleCreater
    } else {
      return findContext(StyleContext)
    }
  }
  static create(node: Node, updateProps: (node: Node, key: string, value: any) => void = updatePorps, isText?: boolean) {
    return new FiberNode(node, updateProps, isText)
  }
  static createText(props: Props) {
    const node = FiberNode.create(document.createTextNode(""), updatePorps, true)
    updateDom(node, props, {})
    return node
  }
  static createFrom(type: string, props: Props) {
    const node = isSVG(type)
      ? FiberNode.create(document.createElementNS("http://www.w3.org/2000/svg", type), updateSVGProps)
      : FiberNode.create(document.createElement(type))
    node.update(props, {})
    return node
  }
  appendAfter(value: FindParentAndBefore): void {
    appendAfter(this, value as any)
  }
  destroy(props: Props): void {
    if (this.style) {
      this.style.destroy()
    }
  }
  update(props?: Props, oldProps?: Props) {
    updateDom(this,
      props,
      oldProps,
      this.createStyle
    )
  }
  init(props: Props) {
    if (props?.ref) {
      props.ref(this.node)
    }
  }
  private realRemove() {
    this.node.parentElement?.removeChild(this.node)
  }
  removeFromParent(props: Props) {
    if (props?.exit) {
      const that = this
      props.exit(this.node).then(() => {
        that.realRemove()
      })
    } else {
      this.realRemove()
    }
    if (props?.ref) {
      props.ref(null)
    }
  }
  style?: StyleNode

  updateProp(key: string, value: any) {
    this._updateProp(this.node, key, value)
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
      const eventType = name.toLowerCase().substring(2)
      node.removeEventListener(eventType, oldProps[name])
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
      const eventType = name.toLowerCase().substring(2)
      node.addEventListener(eventType, props[name])
    })

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
      (dom.node as HTMLElement).classList.remove(dom.style.className)
      dom.style = undefined
    }
  } else {
    if (props.css) {
      //新增
      if (styleCreater) {
        const style = styleCreater()
        style.update(props.css)
        dom.style = style;
        (dom.node as HTMLElement).classList.add(style.className)
      } else {
        throw `使用css但没有找到styleCreater`
      }
    }
  }
}


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
export function appendAfter(dom: FiberNode, parentAndBefore: [FiberNode, FiberNode | null] | [FiberNode | null, FiberNode]) {
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

export function removeFromParent(domParent: FiberNode, dom: FiberNode) {
  domParent.node.removeChild(dom.node)
}


export function getPortalDom(node: Node) {
  return { node }
}


function isSVG(name: string) {
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