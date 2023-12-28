import { ReducerFun, ReducerResult, useBaseReducer } from "better-react";
import { quote } from "wy-helper";


export function useReducer<F, M, T>(reducer: ReducerFun<F, T>, init: M, initFun: (m: M) => T): ReducerResult<F, T>;
export function useReducer<F, T>(reducer: ReducerFun<F, T>, init: T, initFun?: (m: T) => T): ReducerResult<F, T>;
export function useReducer<F, T = undefined>(reducer: ReducerFun<F, T>, init?: T, initFun?: (m: T) => T): ReducerResult<F, T>
export function useReducer(reducer: any, init: any, initFun: any) {
  return useBaseReducer(reducer, init, initFun)
}

export function useReducerFun<F, T>(reducer: ReducerFun<F, T>, init: () => T) {
  return useReducer(reducer, undefined, init)
}


export function createUseReducer<A, M, I = M>(
  reducer: ReducerFun<A, M>,
  initFun?: (i: I) => M
) {
  return function (init: I) {
    return useReducer(reducer, init, initFun || quote as any)
  }
}

export function createUseReducerFun<A, M>(
  reducer: ReducerFun<A, M>,
) {
  return function (initFun: () => M) {
    return useReducer(reducer, undefined, initFun)
  }
}