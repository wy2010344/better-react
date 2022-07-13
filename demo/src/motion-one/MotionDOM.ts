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

export function useMotionDom<T extends keyof DomElements>(
  type: T,
  option: MotionProps,
  props?: Omit<DomElements[T], 'exit'>
): DomElements[T] extends React.DetailedHTMLProps<infer A, infer F> ? F : never {
  const newProps = (props || {}) as DomElements[T]
  if (option.exit) {
    newProps.exit = async () => {
      if (option.exit) {
        const exit = animate(dom as any, option.exit, option.exitOption || option.option)
        if (option.onExit) {
          return exit.finished.then(option.onExit)
        }
        return exit.finished
      }
      return option.onExit?.()
    }
  }
  const dom = useDom(type, newProps)
  useEffect(() => {
    if (option.enter) {
      const a = animate(dom as any, option.enter, option.enterOption || option.option)
      if (option.onFinished) {
        a.finished.then(option.onFinished)
      }
    }
  }, [])

  useEffect(() => {
    if (option.layoutID) {
      const oldDiv = document.getElementById(option.layoutID)
      if (oldDiv) {
        const vdom = dom as any
        const oldRect = oldDiv.getBoundingClientRect()
        const newRect = vdom.getBoundingClientRect() as DOMRect
        const diffX = oldRect.left - newRect.left
        const diffY = oldRect.top - newRect.top
        const scaleWidth = oldRect.width / newRect.width
        const scaleHeight = oldRect.height / newRect.height
        //const transaction = ` translate(${diffX}px,${diffY}px) scaleX(${scaleWidth}) scaleY(${scaleHeight}) `
        //console.log(transaction)
        const transformOrigin = vdom.style.transformOrigin
        vdom.style.transformOrigin = '0 0'
        //vdom.style.transform = transaction
        animate(vdom, {
          x: [diffX, 0],
          y: [diffY, 0],
          scaleX: [scaleWidth, 1],
          scaleY: [scaleHeight, 1],
        }, option.enterOption || option.exitOption).finished.then(() => {
          vdom.style.transformOrigin = transformOrigin
        })
      }
    }
  }, [option.layoutID, option.enterOption || option.option])


  return dom
}
export function useMotionSvg<T extends keyof SvgElements>(
  type: T,
  option: MotionProps,
  props?: SvgElements[T]
): SvgElements[T] extends React.SVGProps<infer F> ? F : never {
  const svg = useSvg(type, props)


  return svg
}