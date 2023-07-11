import { ReducerFun, ReducerResult, useBaseReducer } from "better-react";


export function useReducer<F, M, T>(reducer: ReducerFun<F, T>, init: M, initFun: (m: M) => T): ReducerResult<F, T>;
export function useReducer<F, T>(reducer: ReducerFun<F, T>, init: T, initFun?: (m: T) => T): ReducerResult<F, T>;
export function useReducer<F, T = undefined>(reducer: ReducerFun<F, T>, init?: T, initFun?: (m: T) => T): ReducerResult<F, T>
export function useReducer(reducer: any, init: any, initFun: any) {
  return useBaseReducer(undefined, reducer, init, initFun)
}

export function useReducerFun<F, T>(reducer: ReducerFun<F, T>, init: () => T) {
  return useReducer(reducer, undefined, init)
}