import { useEffect } from 'better-react'
import { useAlways, useMemo, useRef } from './useRef'
import { ReduceState, toReduceState, ValueCenter } from './ValueCenter'
import { useChange } from './useState'
import { useChangeFun } from './useState'
function defaultIsChange<T>(a: T, b: T) {
  return a != b
}


type RefStateProps<T> = {
  /**是否改变 */
  isChange?(a: T, b: T): boolean
  /**内容改变 */
  onChange?(v: T): void
  /**任何调用 */
  onSet?(v: T): void
}
type RefStatePropsWithTrans<T, M> = {
  /**转义*/
  trans?(v: M): T
} & RefStateProps<T>
/**
 * 最后一个是version
 */
type RefState<T> = [T, ReduceState<T>, () => T, () => RefStateProps<T>]
export function useRefState<T>(): RefState<T | undefined>
export function useRefState<T>(init: T | (() => T), arg?: RefStateProps<T>): RefState<T>
export function useRefState<T, M>(init: M, arg: RefStatePropsWithTrans<T, M>): RefState<T>
export function useRefState() {
  const [init, arg] = arguments
  const [state, setState] = typeof (init) == 'function' ? useChangeFun(init) : useChange<any, any>(init, arg?.trans)
  const ref = useRef(state)
  const get = ref.get
  const newArg = useAlways(arg)
  const set = useMemo(() => {
    return toReduceState(value => {
      const arg = newArg()
      const isChange = arg?.isChange || defaultIsChange
      if (isChange(value, ref.get())) {
        ref.set(value)
        setState(value)
        //在内容生效后调用
        arg?.onChange?.(value)
      }
      //都需要在内容生效后调用
      arg?.onSet?.(value)
    }, ref.get)
  }, [])
  return [state, set, get, newArg] as const
}

export function useStoreTriggerRender<T>(store: ValueCenter<T>, arg?: RefStateProps<T>) {
  const [state, setState, getState, getArg] = useRefState<T>(store.get(), arg)
  useEffect(function () {
    const newState = store.get()
    const arg = getArg()
    const isChange = arg?.isChange || defaultIsChange
    if (isChange(newState, state)) {
      setState(store.get())
    }
    return store.subscribe(setState)
  }, [store])
  return state
}