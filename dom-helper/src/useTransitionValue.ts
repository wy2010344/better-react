import { emptyArray } from "wy-helper"
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
