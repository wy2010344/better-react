import { useMemo } from "better-react"
import { useStoreTriggerRender } from "./useRefState"
import { useValueCenterWith } from "./ValueCenter"

/**
 * 这样声明的pop,同步到弹窗里
 * @param vs 
 * @returns 
 */
export function usePopElement(render: () => void) {
  const store = useValueCenterWith(render)
  store.set(render)
  return useMemo(() => {
    return function () {
      const render = useStoreTriggerRender(store)
      render()
    }
  }, [store])
}