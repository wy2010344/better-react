import { DomElements, React, SvgElements, useDom, useSvg } from "better-react-dom";

import { MotionKeyframesDefinition, AnimationOptionsWithOverrides } from "@motionone/dom"
import { useEffect } from "better-react";
import { animate } from 'motion'
export type MotionProps = {
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
    newProps.exit = () => {
      return animate(dom as any, option.exit!, option.exitOption || option.option).finished.then(() => {
        option.onExit?.()
        console.log("did-exist")
      })
    }
  }
  const dom = useDom(type, newProps)
  useEffect(() => {
    if (option.enter) {
      const a = animate(dom as any, option.enter, option.enterOption || option.option)
      a.finished.then(() => {
        option.onFinished?.()
        console.log("did-finished")
      })
      return () => {
        a.pause()
      }
    }
  }, [option.enter, option.enterOption, option.option])


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