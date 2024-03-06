import { ReducerResult } from "better-react";
import { BGColor, emptyArray, animateColor, animateNumber, AnimateValue, TimeoutAnimate, SetValue, singleTimeoutCallback, simpleEqual, } from "wy-helper";
import { useVersion } from "./useVersion";
import { useMemo } from "./useRef";
import { createUseReducer } from "./useReducer";
import { useEffect } from "./useEffect";

export function useAnimationNumber(n: number): AnimateValue<number> {
  const [_, reload] = useVersion()
  return useMemo(() => {
    return animateNumber(reload, n)
  }, emptyArray)
}

export function useAnimationColor(color: BGColor): AnimateValue<BGColor> {
  const [_, reload] = useVersion()
  return useMemo(() => {
    return animateColor(reload, color)
  }, emptyArray)
}

/**
 * css 动画实时去修改元素的style,即时间也从此开始
 * 如果有多元素需要合并,全部订阅到一个中心store上,再对中心store注册监听
 * 在同一线程中多次修改css,只依赖最后一次来触发动画.
 * @param init 
 * @param value 
 * @returns 
 */
export function useTimeoutAnimateValue<T, F>(init: T, equal: (a: T, b: T) => any = simpleEqual) {
  return useMemo(() => {
    return new TimeoutAnimate<T, F>(init, equal)
  }, emptyArray)
}
