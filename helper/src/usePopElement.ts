import { useMemo } from "./useRef"
import { useValueCenter } from "./ValueCenter"
import { useStoreTriggerRender } from "./useStoreTriggerRender"

/**
 * 
 * @todo 会在并发回溯时遇到问题
 * 这样声明的pop,同步到弹窗里
 * @param vs 
 * @returns 
 */
export function usePopElement(render: () => void) {
  const store = useValueCenter(render)
  store.set(render)
  return useMemo(() => {
    return function () {
      const render = useStoreTriggerRender(store)
      render()
    }
  }, store)
}