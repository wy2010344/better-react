import { WithDraftFiber, useFiber, Fiber, useMemo, render, AskNextTimeWork, Props } from "better-react";
import { DomElements, React, SvgElements } from "./html";
import { FiberNode, FiberText } from "./updateDom";
export { scheduleAskTime } from './schedule'
export { StyleNode, isSVG, FiberNode, FiberText, StyleContext } from './updateDom'
export * from './html'


function RootShouldUpdate(a: RootProps, b: RootProps) {
  return a.node != b.node || a.props != b.props || a.reconcile != b.reconcile
}
function RenderRoot(
  fiber: WithDraftFiber<RootProps>
) {
  const { node, reconcile } = fiber.draft.props
  const dom = (fiber.dom || FiberNode.create<RootProps>(
    () => node,
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

export function useContent(content: string) {
  useFiber(function (fiber) {
    fiber.dom = fiber.dom || FiberText.create()
  }, content)
}

const domMap = new Map<string, (fiber: WithDraftFiber<DomElements[keyof DomElements]>) => void>()
function getProps<T>(v: T) {
  return v as Props
}
function createOrGetDomFun<T extends keyof DomElements>(type: T) {
  type = type.toLowerCase() as T
  let old = domMap.get(type)
  if (!old) {
    const createDom = FiberNode.createDom(type, getProps)
    old = function (fiber) {
      const dom = (fiber.dom || createDom()) as FiberNode<Props>
      fiber.dom = dom
      dom.reconcile()
      fiber.draft.props?.children?.()
    }
    domMap.set(type, old)
  }
  return old
}

const EMPTYPROPS = {}
export function useDom<T extends keyof DomElements>(type: T, props?: DomElements[T]) {
  return useFiber(createOrGetDomFun(type), props || EMPTYPROPS) as unknown as FiberWithDom<T>
}

const svgMap = new Map<string, (fiber: WithDraftFiber<SvgElements[keyof SvgElements]>) => void>()
function createOrGetSvgFun<T extends keyof SvgElements>(type: T) {
  type = type.toLowerCase() as T
  let old = svgMap.get(type)
  if (!old) {
    const createSvg = FiberNode.createSvg(type, getProps)
    old = function (fiber) {
      if (!fiber.dom) {
        fiber.dom = createSvg()
      }
      const dom = (fiber.dom || createSvg()) as FiberNode<Props>
      dom.reconcile()
      fiber.draft.props?.children?.()
    }
    svgMap.set(type, old)
  }
  return old
}
export function useSvg<T extends keyof SvgElements>(type: T, props?: SvgElements[T]) {
  return useFiber(createOrGetSvgFun(type), props || EMPTYPROPS) as unknown as FiberWithSvg<T>
}
type FiberWithDom<T extends keyof DomElements> = Omit<Fiber<DomElements[T]>, "dom"> & {
  dom: Omit<FiberNode<DomElements[T]>, "node"> & {
    node?: DomElements[T] extends React.SVGProps<infer F> ? F : never
  }
}

type FiberWithSvg<T extends keyof SvgElements> = Omit<Fiber<SvgElements[T]>, "dom"> & {
  dom: Omit<FiberNode<SvgElements[T]>, "node"> & {
    node?: SvgElements[T] extends React.SVGProps<infer F> ? F : never
  }
}