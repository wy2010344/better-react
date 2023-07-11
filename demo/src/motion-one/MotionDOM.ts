import { DomAttribute, DomElement, DomElementType, DomWithChildren, React, SvgAttribute, SvgElement, SvgElementType, SvgWithChildren, useDom, useSvg } from "better-react-dom";

import { MotionKeyframesDefinition, AnimationOptionsWithOverrides } from "@motionone/dom"
import { useEffect } from "better-react";
import { animate, UnresolvedValueKeyframe } from 'motion'
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

export function useMotionDom<T extends DomElementType>(
  type: T,
  option: MotionProps,
  props?: Omit<DomWithChildren<T>, 'exit'>
): DomElement<T> {
  const newProps = (props || {}) as DomWithChildren<T>
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
  const dom = useDom(type, newProps)
  useEffect(() => {
    if (option.layoutID) {
      const oldStyle = layoutPool.get(option.layoutID)
      if (oldStyle) {
        const map = {
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

export function useMotionSvg<T extends SvgElementType>(
  type: T,
  option: MotionProps,
  props?: SvgWithChildren<T>
): SvgElement<T> {
  const svg = useSvg(type, props)
  return svg
}