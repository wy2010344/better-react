import { Fiber, Props, BRNode } from "better-react";
import { BRFun } from "better-react/dist/Fiber";
import { FiberNode } from "./updateDom";
export { FiberNode, StyleNode, StyleContext } from './updateDom'
export { askTimeWork } from './askTimeWork'
export type { React } from '../@types/react'

export type BetterNode = BRNode<any>
  /**字符串节点 */
  | number | bigint
  | string
  /**将作为fragment */
  | BetterNode[]
  /**不存在的节点 */
  | null | undefined | boolean

function TextElement(fiber: Fiber) {
  if (!fiber.dom) {
    fiber.dom = FiberNode.createText()
  }
  return []
}
const TextElementFun = createFun()
export function createTextElement(text: string) {
  return {
    type: TextElementFun,
    render: TextElement,
    props: {
      nodeValue: text,
      children: []
    }
  }
}

/**
 * 如果是自定义类型,无法确定children是数组还是单节点.所以对FC的children必须限制V|V[]
 * @param fiber 
 * @returns 
 */
function RenderDomFun(fiber: Fiber) {
  const children = fiber.props?.children.length == 1
    ? fiber.props?.children[0]
    : fiber.props?.children
  return [fiber.type({
    ...fiber.props,
    children
  })]
}
/**
 * 所有jsx的创建入口
 * @param type 
 * @param props 
 * @param children 
 * @returns 
 */
export function createElement(type: any, props: Props, ...children: any[]) {
  const pChildren = props?.children
  const fromChildren = (pChildren ? (Array.isArray(pChildren) ? pChildren : [pChildren]) : children)
  const realProps = {
    ...props,
    children: fromChildren
  }
  if (type == Fragment) {
    return {
      type,
      render: FragmentRender,
      props: realProps
    }
  } else if (typeof (type) == 'function') {
    return {
      type,
      render: RenderDomFun,
      props: realProps
    }
  } else {
    const v = getDOM(type)
    return {
      ...v,
      props: realProps
    }
  }
}

/**
 * 对于原生节点的子节点、Fragment的子结点、数组节点的子节点,需要这么处理
 * @param children 
 * @param isDom 
 * @returns 
 */
function mapChildren(children: any[], isDom: boolean): Fiber[] {
  return children.map(child => {
    //null/""/
    const tp = typeof (child)
    if (tp == 'object') {
      if (Array.isArray(child)) {
        //数组,作为代码片段,需要准备成Fragment?
        return {
          type: MultiNode,
          render: MultiNodeRender,
          props: {
            children: child
          }
        }
      } else {
        if (child) {
          if (typeof (child.type) == 'function' && typeof (child.render) == 'function' && child.props) {
            //不为null,需要为BRNode
            return child
          } else {
            console.warn('not a child type', child)
          }
        }
      }
    } else if (tp == 'function') {
      console.warn("no need as function", child)
    } else {
      if (isDom) {
        if (tp == 'string') {
          if (tp) {
            //不为""
            return createTextElement(child)
          }
        } else if (tp == 'number' || tp == 'bigint') {
          return createTextElement(child)
        } else {
          //其它,舍弃掉,bool/symbol/undefined
        }
      } else {
        console.warn("svg can not have pure text", child)
      }
    }
    return {
      type: EmptyNode,
      render: EmptyNodeRender,
      props: {
        value: child
      }
    }
  })
}

function getParentDom(fiber: Fiber) {
  let tempFiber = fiber
  while (tempFiber && !tempFiber.dom) {
    tempFiber = tempFiber.parent!
  }
  return tempFiber.dom as FiberNode
}
/*****代码片段*********************************/
export type FragmentParam = {
  children?: BetterNode
}
export const Fragment: BRFun<FragmentParam> = (props) => {
  return {
    type: Fragment,
    props
  }
}
function FragmentRender(fiber: Fiber) {
  return mapChildren(fiber.props.children, getParentDom(fiber).type == 'dom')
}
/*****列表的处理*******************************/
function MultiNodeRender(fiber: Fiber) {
  return mapChildren(fiber.props.children, getParentDom(fiber).type == 'dom')
}
function MultiNode(props: Props) {
  return {
    type: MultiNode,
    props
  }
}
/*****空白的占位*******************************/
function EmptyNodeRender(fiber: Fiber) {
  return null
}
function EmptyNode(props: Props) {
  return {
    type: EmptyNode,
    props
  }
}
/***********************************************使用统一的函数作为类型****************************************************/
function createFun<T extends {} = any>() {
  const FC: BRFun<T> = (props) => {
    return {
      type: FC,
      props
    }
  }
  return FC
}

/**
 * 为了同位比较,需要这样处理
 * @param type 
 * @returns 
 */
function getRenderDom(type: string) {
  return function (fiber: Fiber) {
    if (!fiber.dom) {
      fiber.dom = FiberNode.createFrom(type)
    }
    const dom = fiber.dom as FiberNode
    dom.reconcile()
    return mapChildren(fiber.props.children, dom.type == 'dom')
  }
}
const domPool: Map<string, {
  type: BRFun<any>
  render(fiber: Fiber): any
}> = new Map()
function getDOM(t: string) {
  let v = domPool.get(t)
  if (v) {
    return v
  } else {
    v = {
      type: createFun(),
      render: getRenderDom(t)
    }
    domPool.set(t, v)
    return v
  }
}