import { ValueCenter, quote } from "wy-helper";
import { EmptyFun } from "wy-helper";
import { useEffect } from "./useEffect";
import { useChange } from "./useState";

/**
 * 
 * @param subscribe 最好保证订阅函数的独立
 * @param getSnapshot 
 * @returns 
 */
export function useSyncExternalStore<T>(subscribe: (callback: EmptyFun) => EmptyFun, getSnapshot: () => T) {
  const [state, setState] = useChange(getSnapshot())
  useEffect(() => {
    if (state != getSnapshot()) {
      setState(getSnapshot())
    }
    return subscribe(function () {
      setState(getSnapshot())
    })
  }, [subscribe])
  return state
}
/**
 *
 * @param store
 * @param arg 只能初始化,中间不可以改变,即使改变,也是跟随的
 */
export function useStoreTriggerRender<T, M>(store: ValueCenter<T>, filter: (a: T) => M): M;
export function useStoreTriggerRender<T>(store: ValueCenter<T>, filter?: (a: T) => T): T;
export function useStoreTriggerRender<T>(store: ValueCenter<T>) {
  const filter = arguments[1] || quote
  return useSyncExternalStore(store.subscribe, function () {
    return filter(store.get())
  })
}