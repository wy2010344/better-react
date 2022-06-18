import { WithDraftFiber, useFiber, Fiber, useMemo, render, AskNextTimeWork, Props } from "better-react";
import { DomElements, React, SvgElements } from "./html";
import { FiberNode, FiberText } from "./updateDom";
export { scheduleAskTime } from './schedule'
export { StyleNode, isSVG, FiberNode, FiberText, StyleContext } from './updateDom'
export * from './html'


function RenderRoot(
  fiber: WithDraftFiber<RootProps>
) {
  const { node, reconcile } = fiber.draft.props
  const dom = useMemo(() => {
    return FiberNode.create<RootProps>(
      () => node,
      getRootProps
    )
  }, [node])
  fiber.dom = dom
  dom.reconcile()
  reconcile()
}
function RootShouldUpdate(a: RootProps, b: RootProps) {
  return a.node != b.node || a.props != b.props || a.reconcile != b.reconcile
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
export type FiberNodeProps<F, T extends keyof F> = {
  type: T,
  props: F[T]
}
function getProps<F, T extends keyof F>(v: FiberNodeProps<F, T>) {
  return v.props as unknown as Props
}
function fiberShouldUpdate<F, T extends keyof F>(a: FiberNodeProps<F, T>, b: FiberNodeProps<F, T>) {
  return a.type != b.type || a.props != b.props
}

function ContentRender(
  fiber: WithDraftFiber<string>
) {
  const dom = useMemo(FiberText.create, [])
  fiber.dom = dom
}

export function useContent(content: string) {
  return useFiber(ContentRender, content)
}

const domMap = new Map<string, () => FiberNode<FiberNodeProps<DomElements, keyof DomElements>>>()
function DOMElement<T extends keyof DomElements>(
  fiber: WithDraftFiber<FiberNodeProps<DomElements, T>>
) {
  const { type, props } = fiber.draft.props
  const dom = useMemo(() => {
    let old = domMap.get(type)
    if (!old) {
      old = FiberNode.createDom(type, getProps)
      domMap.set(type, old)
    }
    const dom = old()
    return dom
  }, [type])
  fiber.dom = dom
  dom.reconcile()
  props.children?.()
}

const EMPTYPROPS = {}

export function useDom<T extends keyof DomElements>(type: T, props?: DomElements[T]) {
  return useFiber<FiberNodeProps<DomElements, T>>(
    DOMElement,
    { type, props: props || EMPTYPROPS },
    fiberShouldUpdate
  ) as unknown as FiberWithDom<T>
}

type FiberWithDom<T extends keyof DomElements> = Omit<Fiber<FiberNodeProps<DomElements, T>>, "dom"> & {
  dom: Omit<FiberNode<DomElements[T]>, "node"> & {
    node?: DomElements[T] extends React.SVGProps<infer F> ? F : never
  }
}

const svgMap = new Map<string, () => FiberNode<FiberNodeProps<SvgElements, keyof SvgElements>>>()
function SVGElement<T extends keyof SvgElements>(
  fiber: WithDraftFiber<FiberNodeProps<SvgElements, T>>
) {
  const { type, props } = fiber.draft.props
  const dom = useMemo(() => {
    let old = svgMap.get(type)
    if (!old) {
      old = FiberNode.createSvg(type, getProps)
      svgMap.set(type, old)
    }
    const dom = old()
    return dom
  }, [type])
  fiber.dom = dom
  dom.reconcile()
  props.children?.()
}

export function useSvg<T extends keyof SvgElements>(type: T, props?: SvgElements[T]) {
  return useFiber<FiberNodeProps<SvgElements, T>>(
    SVGElement,
    { type, props: props || EMPTYPROPS },
    fiberShouldUpdate
  ) as unknown as FiberWithSvg<T>
}

type FiberWithSvg<T extends keyof SvgElements> = Omit<Fiber<FiberNodeProps<SvgElements, T>>, "dom"> & {
  dom: Omit<FiberNode<SvgElements[T]>, "node"> & {
    node?: SvgElements[T] extends React.SVGProps<infer F> ? F : never
  }
}