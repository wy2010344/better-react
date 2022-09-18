import { DomElements, React, SvgElements, useDom, useSvg } from "better-react-dom";

import { MotionKeyframesDefinition, AnimationOptionsWithOverrides } from "@motionone/dom"
import { useEffect } from "better-react";
import { animate } from 'motion'
export type MotionProps = {
  layoutID?: string
  enter?: MotionKeyframesDefinition
  exit?: MotionKeyframesDefinition
  enterOption?: AnimationOptionsWithOverrides
  exitOption?: AnimationOptionsWithOverrides
  option?: AnimationOptionsWithOverrides
  onExit?(): void
  onFinished?(): void
}
/**
 * 动画未完成时如果被新动画加入,则立即进行到结束状态开始新动画.
 * @param create 
 * @param option 
 * @param props 
 * @returns 
 */
function useBaseMotionDom<T extends {
  exit?(e: any): Promise<void>
}>(create: (props: T) => Node, option: MotionProps, props: T) {
  const newProps = { ...props }
  if (option.exit) {
    newProps.exit = async () => {
      const thisExit = option.layoutID
        ? () => {
          layoutPool.set(option.layoutID!, getLayoutParam(dom as any))
          option.onExit?.()
        }
        : option.onExit

      if (option.exit) {
        const exit = animate(dom as any, option.exit, option.exitOption || option.option)
        if (thisExit) {
          return exit.finished.then(thisExit)
        }
        return exit.finished
      }
      return thisExit?.()
    }
  } else if (option.layoutID) {
    newProps.exit = async () => {
      layoutPool.set(option.layoutID!, getLayoutParam(dom as any))
    }
  }
  const dom = create(newProps)
  useEffect(() => {
    if (option.layoutID) {
      const oldStyle = layoutPool.get(option.layoutID)
      if (oldStyle) {
        const map: MotionKeyframesDefinition = {
          ...option.enter
        }
        const vdom = dom as any
        const newStyle = getLayoutParam(vdom)

        const diffX = oldStyle.rect.left - newStyle.rect.left
        const diffY = oldStyle.rect.top - newStyle.rect.top
        const scaleWidth = oldStyle.rect.width / newStyle.rect.width
        const scaleHeight = oldStyle.rect.height / newStyle.rect.height

        map.x = toNew(diffX, map.x || 0)
        map.y = toNew(diffY, map.y || 0)
        map.scaleX = toNew(scaleWidth, map.scaleX || 1)
        map.scaleY = toNew(scaleHeight, map.scaleY || 1)
        map.background = toNew(oldStyle.background, map.background || newStyle.background)
        map.color == toNew(oldStyle.color, map.color || newStyle.color)
        map.borderRadius = toNew(oldStyle.borderRadius, map.borderRadius || newStyle.borderRadius)

        const transformOrigin = vdom.style.transformOrigin
        vdom.style.transformOrigin = '0 0'
        //vdom.style.transform = transaction
        animate(vdom, map, option.enterOption || option.option).finished.then(() => {
          vdom.style.transformOrigin = transformOrigin
          layoutPool.delete(option.layoutID!)
        })
      }
    } else if (option.enter) {
      const a = animate(dom as any, option.enter, option.enterOption || option.option)
      if (option.onFinished) {
        a.finished.then(option.onFinished)
      }
    }
  }, [])

  return dom
}
export function useMotionDom<T extends keyof DomElements>(
  type: T,
  option: MotionProps,
  props?: Omit<DomElements[T], 'exit'>
): DomElements[T] extends React.DetailedHTMLProps<infer _, infer F> ? F : never {
  return useBaseMotionDom((newProps) => useDom(type, newProps) as Node, option, props || {}) as any
}

function toNew<T>(v: T, vs: T | T[]) {
  if (Array.isArray(vs)) {
    return [v, ...vs]
  }
  return [v, vs]
}

function getLayoutParam(node: HTMLElement): LayoutParam {
  const style = getComputedStyle(node)
  return {
    rect: node.getBoundingClientRect(),
    background: style.background,
    color: style.color,
    borderRadius: style.borderRadius
  }
}
type LayoutParam = {
  rect: DOMRect
  background: string
  color: string
  borderRadius: string
}
const layoutPool = new Map<string, LayoutParam>()

export function useMotionSvg<T extends keyof SvgElements>(
  type: T,
  option: MotionProps,
  props?: SvgElements[T]
): SvgElements[T] extends React.SVGProps<infer F> ? F : never {
  return useBaseMotionDom((newProps) => useSvg(type, newProps) as Node, option, props || {}) as any
}
