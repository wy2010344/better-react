import { useEffect, useMemo, useState } from 'better-react'
import { useRef } from './useRef'
import { ReduceState, toReduceState, ValueCenter } from './ValueCenter'
function defaultIsChange<T>(a: T, b: T) {
  return a != b
}

type RefState<T> = [T, ReduceState<T>, () => T]
export function useRefState<T>(): RefState<T | undefined>
export function useRefState<T>(init: T, arg?: {
  /**是否改变 */
  isChange?(a: T, b: T): boolean
  /**内容改变 */
  onChange?(v: T): void
  /**任何调用 */
  onSet?(v: T): void
}): RefState<T>
export function useRefState<T>() {
  const [init, arg] = arguments
  const [state, setState] = useState(init)
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
    }, get)
  }, [arg?.isChange, arg?.onChange, arg?.onSet])
  return [state, set, get] as const
}



export function useStoreTriggerRender<T>(store: ValueCenter<T>, isChange?: (a: T, b: T) => boolean) {
  const [state, setState] = useRefState<T>(store.get(), {
    isChange
  })
  useEffect(function () {
    setState(store.get())
    return store.subscribe(setState)
  }, [store])
  return state
}