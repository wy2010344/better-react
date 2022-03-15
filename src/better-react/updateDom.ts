import { Props } from "./Fiber"




export type FiberNode = {
  node: Node
  style?: StyleNode
}
export type StyleNode = {
  className: string
  update(css: string): void
  destroy(): void
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
 * @param _dom 
 * @param prevProps 
 * @param nextProps 
 */
export function updateDom(
  _dom: FiberNode,
  prevProps: Props = emptyProps,
  nextProps: Props = emptyProps,
  styleCreater?: () => StyleNode
) {
  const dom = _dom.node as any
  //移除旧事件：新属性中不存在相应事件，或者事件不一样
  const prevKeys = Object.keys(prevProps)
  const nextKeys = Object.keys(nextProps)
  const style = nextProps.style
  if (style && typeof (style) == 'object') {
    //转化成字符串。会造成对style的全覆盖，所以不能单独修改元素
    nextProps.style = purifyStyle(style)
  }
  prevKeys
    .filter(isEvent)
    .filter(key => !(key in nextProps) || isNew(prevProps, nextProps)(key))
    .forEach(name => {
      const eventType = name.toLowerCase().substring(2)
      dom.removeEventListener(eventType, prevProps[name])
    })
  //移除旧的不存在属性
  prevKeys
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach(name => dom[name] = "")
  //修改变更属性
  nextKeys
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => dom[name] = nextProps[name])
  //添加变更事件
  nextKeys
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      const eventType = name.toLowerCase().substring(2)
      dom.addEventListener(eventType, nextProps[name])
    })

  if (prevProps.css) {
    if (!_dom.style) {
      throw `请传入oldStyle`
    }
    if (nextProps.css) {
      //更新
      if (nextProps.css != prevProps.css) {
        _dom.style.update(nextProps.css)
      }
    } else {
      //删除
      _dom.style.destroy();
      (_dom.node as HTMLElement).classList.remove(_dom.style.className)
      _dom.style = undefined
    }
  } else {
    if (nextProps.css) {
      //新增
      if (styleCreater) {
        const style = styleCreater()
        style.update(nextProps.css)
        _dom.style = style;
        (_dom.node as HTMLElement).classList.add(style.className)
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
  return key != 'children' && key != 'css' && !isEvent(key)
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
/**
 * 创建节点
 * @param fiber 
 * @returns 
 */
export function createDom(
  type: string,
  props: Props | undefined,
  createStyle?: () => StyleNode
): FiberNode {
  const dom = type == "TEXT_ELEMENT"
    ? document.createTextNode("")
    : document.createElement(type)


  const node: FiberNode = {
    node: dom
  }
  updateDom(node, {}, props, createStyle)
  return node
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
    const next = before?.node.nextSibling
    if (next) {
      if (next != dom.node) {
        //不处理
        parentDom.insertBefore(dom.node, next!)
      }
    } else if (parentDom.lastChild != dom.node) {
      parentDom.appendChild(dom.node)
    }
  } else {
    console.error("未找到parent-dom????")
  }
}

export function removeFromParent(domParent: FiberNode, dom: FiberNode) {
  domParent.node.removeChild(dom.node)

}

export function removeFiberDom(dom: FiberNode) {
  if (dom.style) {
    dom.style.destroy()
  }
}