import { hookCreateChangeAtom, hookRequestReconcile } from "better-react";
import { Reducer, ReducerWithDispatch, SetValue, emptyArray, quote, simpleEqual } from "wy-helper";
import { useMemo } from "./useRef";


export type ReducerResult<F, T> = [T, SetValue<F>];

export function useSideReducer<F, M, T>(
  reducer: ReducerWithDispatch<T, F>,
  init: M,
  initFun: (m: M) => T,
  eq?: (a: T, b: T) => any): ReducerResult<F, T>;
export function useSideReducer<F, T>(
  reducer: ReducerWithDispatch<T, F>,
  init: T,
  initFun?: (m: T) => T,
  eq?: (a: T, b: T) => any): ReducerResult<F, T>;
export function useSideReducer<F, T = undefined>(
  reducer: ReducerWithDispatch<T, F>,
  init?: T,
  initFun?: (m: T) => T,
  eq?: (a: T, b: T) => any): ReducerResult<F, T>
export function useSideReducer(reducer: any, init: any, initFun: any, eq: any, asSingle?: any) {
  return useBaseReducer(reducer, init, initFun, eq)
}

function useBaseReducer(reducer: any, init: any, initFun: any, eq: any, asSingle?: any) {
  const createChangeAtom = hookCreateChangeAtom()
  const reconcile = hookRequestReconcile()
  const hook = useMemo(() => {
    /**
     * 这个memo不能像jetpack compose一样依赖key变化,因为是异步生效的
     */
    const realEq = eq || simpleEqual
    const trans = initFun || quote
    const value = createChangeAtom(trans(init))
    function set(action: any) {
      reconcile(function () {
        const oldValue = value.get()
        const out = reducer(oldValue, action)
        let newValue = out
        let list = emptyArray
        if (!asSingle) {
          newValue = out[0]
          list = out[1]
        }
        if (!realEq(oldValue, newValue)) {
          value.set(newValue)
          return list.map(act => {
            return function () {
              act(set)
            }
          })
        }
      })
    }
    return {
      value,
      set,
      reducer,
      init,
      initFun,
      eq
    }
  }, emptyArray)
  if (reducer != hook.reducer) {
    console.warn("reducer上的reducer变化!!")
  }
  return [hook.value.get(), hook.set]
}

export function useReducerFun<F, T>(
  reducer: Reducer<T, F>,
  init: () => T,
  eq?: (a: T, b: T) => any) {
  return useReducer(reducer, undefined, init, eq)
}


export function createUseReducer<A, M, I = M>(
  reducer: Reducer<M, A>,
  initFun?: (i: I) => M,
  eq?: (a: M, b: M) => any
) {
  return function (init: I) {
    return useReducer(reducer, init, initFun || quote as any, eq)
  }
}

export function createUseReducerFun<A, M>(
  reducer: Reducer<M, A>,
  eq?: (a: M, b: M) => any
) {
  return function (initFun: () => M) {
    return useReducer(reducer, undefined, initFun, eq)
  }
}

export function useReducer<F, M, T>(
  reducer: Reducer<T, F>,
  init: M,
  initFun: (m: M) => T,
  eq?: (a: T, b: T) => any): ReducerResult<F, T>;
export function useReducer<F, T>(
  reducer: Reducer<T, F>,
  init: T,
  initFun?: (m: T) => T,
  eq?: (a: T, b: T) => any): ReducerResult<F, T>;
export function useReducer<F, T = undefined>(
  reducer: Reducer<T, F>,
  init?: T,
  initFun?: (m: T) => T,
  eq?: (a: T, b: T) => any): ReducerResult<F, T>
export function useReducer(reducer: any, init: any, initFun: any, eq: any) {
  return useBaseReducer(reducer, init, initFun, eq, true)
}
