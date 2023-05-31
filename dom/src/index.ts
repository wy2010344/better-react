import { WithDraftFiber, useFiber, render, AskNextTimeWork, Props } from "better-react";
import { DomElements, React, SvgElements } from "./html";
import { FiberNode, FiberText } from "./updateDom";
export { scheduleAskTime } from './schedule'
export { StyleNode, isSVG, FiberNode, FiberText, StyleContext, underlineToCamel } from './updateDom'
export { getAliasOfAttribute, getAttributeAlias } from './getAttributeAlias'
export * from './html'
/***
 * 先声明dom节点再装入use配置参数,以实现dom节点复用?
 * 目前无需求.
 * 比如移动,其实一些dom状态会丢失,如scrollTop
 * 可能有一些三方组件的封装,配置参数却需要自定义,而不是dom参数
 */

function RootShouldUpdate(a: RootProps, b: RootProps) {
  return a.node != b.node || a.props != b.props || a.reconcile != b.reconcile
}
function RenderRoot(
  fiber: WithDraftFiber<RootProps>
) {
  const { node, reconcile } = fiber.draft.props
  const dom = (fiber.dom || FiberNode.create<RootProps>(
    node,
    getRootProps
  )) as FiberNode<Props>
  fiber.dom = dom
  dom.reconcile()
  reconcile()
}
type RootProps = {
  node: Node
  reconcile(): void
  props: {
    portalTarget(): Node | null
  }
}
function getRootProps(v: RootProps) {
  return v.props
}
export function createRoot(node: Node, reconcile: () => void, ask: AskNextTimeWork) {
  return render<RootProps>(
    RenderRoot,
    {
      node,
      reconcile,
      props: {
        portalTarget() {
          return node.parentNode
        },
      }
    },
    RootShouldUpdate,
    ask)
}

function RenderNode(fiber: WithDraftFiber) {
  const dom = fiber.dom as FiberNode<Props>
  dom.reconcile()
  fiber.draft.props?.children?.()
}
function RenderText(fiber: WithDraftFiber<string>) {

}
export function useContent(content: string) {
  const fiber = useFiber(RenderText, content)
  if (!fiber.dom) {
    fiber.dom = FiberText.create()
  }
  return (fiber.dom as any).node as Text
}

const domMap = new Map<string, () => FiberNode<any>>()
function getProps<T>(v: T) {
  return v as Props
}
function createDomFun<T extends keyof DomElements>(type: T) {
  type = type.toLowerCase() as T
  let old = domMap.get(type)
  if (old) {
    return old()
  }
  const createDom = FiberNode.createDom(type, getProps)
  domMap.set(type, createDom)
  return createDom()
}

const EMPTYPROPS = {}
export function useDom<T extends keyof DomElements>(type: T, props?: DomElements[T]) {
  const fiber = useFiber(RenderNode, props || EMPTYPROPS)
  if (!fiber.dom) {
    fiber.dom = createDomFun(type)
  }
  return (fiber.dom as FiberNode<any>).node as DomElements[T] extends React.DetailedHTMLProps<infer A, infer F> ? F : never
}

const svgMap = new Map<string, () => FiberNode<any>>()
function createSvgFun<T extends keyof SvgElements>(type: T) {
  //大小写敏感
  let old = svgMap.get(type)
  if (old) {
    return old()
  }
  const createSvg = FiberNode.createSvg(type, getProps)
  svgMap.set(type, createSvg)
  return createSvg()
}
export function useSvg<T extends keyof SvgElements>(type: T, props?: SvgElements[T]) {
  const fiber = useFiber(RenderNode, props || EMPTYPROPS)
  if (!fiber.dom) {
    fiber.dom = createSvgFun(type)
  }
  return (fiber.dom as FiberNode<any>).node as SvgElements[T] extends React.SVGProps<infer F> ? F : never
}