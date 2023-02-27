import { useEffect, useMemo, useState } from 'better-react'
import { useRef, useRefValue } from './useRef'
import { ReduceState, toReduceState, ValueCenter } from './ValueCenter'
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
/**
 * 最后一个是version
 */
type RefState<T> = [T, ReduceState<T>, () => T]
export function useRefState<T>(): RefState<T | undefined>
export function useRefState<T>(init: T | (() => T), arg?: RefStateProps<T>): RefState<T>
export function useRefState<T>() {
  const [init, arg] = arguments
  const [state, setState] = useState<T>(init)
  const ref = useRef(state)
  const get = ref.get
  const set = useMemo(() => {
    return toReduceState<T>(value => {
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
  }, [arg?.isChange, arg?.onChange, arg?.onSet])
  return [state, set, get] as const
}



export function useStoreTriggerRender<T>(store: ValueCenter<T>, arg?: RefStateProps<T>) {
  const [state, setState] = useRefState<T>(store.get(), arg)
  useEffect(function () {
    const newState = store.get()
    const isChange = arg?.isChange || defaultIsChange
    if (isChange(newState, state)) {
      setState(store.get())
    }
    return store.subscribe(setState)
  }, [store])
  return state
}