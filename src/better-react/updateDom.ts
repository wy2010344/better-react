import { Fiber, Props } from "./Fiber"

const emptyProps = {}
/**
 * 更新节点
 * @param _dom 
 * @param prevProps 
 * @param nextProps 
 */
export function updateDom(_dom: Node, prevProps: Props = emptyProps, nextProps: Props = emptyProps) {
  const dom = _dom as any
  //移除旧事件：新属性中不存在相应事件，或者事件不一样
  const prevKeys = Object.keys(prevProps)
  const nextKeys = Object.keys(nextProps)
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
  return key != 'children' && !isEvent(key)
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
export function createDom(fiber: Fiber): Node {
  const dom = fiber.type == "TEXT_ELEMENT"
    ? document.createTextNode("")
    : document.createElement(fiber.type)
  updateDom(dom, {}, fiber.props)
  return dom
}