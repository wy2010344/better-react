import { useMemo } from './useRef'
import { ReducerFun, } from 'better-react'
import { useReducer } from './useReducer'
import { Subscriber, valueCenterOf, emptyArray, quote, SetValue } from "wy-helper"


/**
 * 其实没必要了,既然能访问实时值.
 */
export type RefReducerResult<F, T> = [T, SetValue<F>, () => T, Subscriber<T>, () => number];
export function useRefReducer<F, M, T>(reducer: ReducerFun<F, T>, init: M, initFun: (m: M) => T): RefReducerResult<F, T>;
export function useRefReducer<F, T>(reducer: ReducerFun<F, T>, init: T, initFun?: (m: T) => T): RefReducerResult<F, T>;
export function useRefReducer<F, T = undefined>(reducer: ReducerFun<F, T>, init?: T, initFun?: (m: T) => T): RefReducerResult<F, T>
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