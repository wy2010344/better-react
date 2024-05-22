import { EmptyFun, delay, emptyArray } from "wy-helper"
import { useAtom, useEffect } from "better-react-helper"
import { CNSInfer, ClsWithStyle, GetRef, TriggerMConfig, effectCssAinmationFirst, effectCssAnimationOther } from "wy-dom-helper"



export function useTriggerStyle<
  T extends ElementCSSInlineStyle & Element,
  M extends ClsWithStyle,
  Dep extends readonly any[]
>(
  ref: GetRef<T>,
  render: (deps: Dep) => TriggerMConfig<T, M>,
  deps: Dep
) {
  const cacheStyle = useAtom<[M, CNSInfer<M>]>(null as any)
  useEffect(() => {
    const out = render(deps)
    if (cacheStyle.get()) {
      return effectCssAnimationOther(ref, out, cacheStyle)
    } else {
      return effectCssAinmationFirst(ref, out, cacheStyle)
    }
  }, deps)
  return render(deps).target
}

/**
 * 只做入场动画
 * @param ref 
 * @param init 
 * @returns 
 */
export function useTriggerStyleInit<
  T extends ElementCSSInlineStyle & Element,
  M extends ClsWithStyle
>(
  ref: GetRef<T>,
  init: TriggerMConfig<T, M>
) {
  useEffect(() => {
    return effectCssAinmationFirst(ref, init)
  }, emptyArray)
  return init.target
}

export function getTimeoutPromise(time: number, then: EmptyFun) {
  return function () {
    return delay(time).then(then)
  }
}

export function useTriggerStyleWithShow<
  T extends ElementCSSInlineStyle & Element,
  M extends ClsWithStyle
>(
  ref: GetRef<T>,
  exiting: any,
  init: TriggerMConfig<T, M>,
  exit: TriggerMConfig<T, M>
) {
  return useTriggerStyle(ref, function () {
    if (exiting) {
      return exit
    } else {
      return init
    }
  }, [!exiting])
}
export function subscribeTimeout(callback: EmptyFun, time: number) {
  /**
   * 需要取消订阅,因为开发者模式useEffect执行多次,不取消会造成问题
   */
  const inv = setTimeout(callback, time)
  return function () {
    clearTimeout(inv)
  }
}