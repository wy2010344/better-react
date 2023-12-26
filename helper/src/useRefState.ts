import { useAtomBind, useMemo } from './useRef'
import { useChange } from './useState'
import { useCallback } from './useCallback'
import { HookValueSet, ReducerFun, emptyArray, quote } from 'better-react'
import { useReducer } from './useReducer'
import { Subscriber, valueCenterOf } from './ValueCenter'
type RefState<T> = [T, (v: T) => void, () => T]
export function useRefState<T, M>(init: M, trans: (v: M) => T): RefState<T>
export function useRefState<T>(init: T): RefState<T>
export function useRefState() {
  const [init, trans] = arguments
  const [state, setState] = useChange(init, trans)
  const lock = useAtomBind(state)

  const setValue = useCallback((value) => {
    if (value != lock.get()) {
      lock.set(value)
      setState(value)
    }
  }, emptyArray)
  return [state, setValue, lock.get]
}




type ReducerResult<F, T> = [T, HookValueSet<F>, () => T, Subscriber<T>, () => number];
export function useRefReducer<F, M, T>(reducer: ReducerFun<F, T>, init: M, initFun: (m: M) => T): ReducerResult<F, T>;
export function useRefReducer<F, T>(reducer: ReducerFun<F, T>, init: T, initFun?: (m: T) => T): ReducerResult<F, T>;
export function useRefReducer<F, T = undefined>(reducer: ReducerFun<F, T>, init?: T, initFun?: (m: T) => T): ReducerResult<F, T>
export function useRefReducer(reducer: any, init: any, initFun: any) {
  const [value, _dispatch] = useReducer(reducer, init, initFun)
  const { dispatch, get, subscribe, size } = useMemo(function () {
    const value = valueCenterOf((initFun || quote)(init))
    return {
      dispatch(action: any) {
        _dispatch(action)
        value.set(reducer(action))
      },
      get() {
        return value.get()
      },
      subscribe: value.subscribe.bind(value),
      size() {
        return value.poolSize()
      }
    }
  }, emptyArray)
  return [value, dispatch, get, subscribe, size]
}
