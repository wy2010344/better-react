import { ReducerFun, ReducerResult, useBaseReducer } from "better-react";
import { quote } from "wy-helper";


export function useReducer<F, M, T>(
  reducer: ReducerFun<F, T>,
  init: M,
  initFun: (m: M) => T,
  eq?: (a: T, b: T) => any): ReducerResult<F, T>;
export function useReducer<F, T>(
  reducer: ReducerFun<F, T>,
  init: T,
  initFun?: (m: T) => T,
  eq?: (a: T, b: T) => any): ReducerResult<F, T>;
export function useReducer<F, T = undefined>(
  reducer: ReducerFun<F, T>,
  init?: T,
  initFun?: (m: T) => T,
  eq?: (a: T, b: T) => any): ReducerResult<F, T>
export function useReducer(reducer: any, init: any, initFun: any, eq: any) {
  return useBaseReducer(reducer, init, initFun, eq)
}

export function useReducerFun<F, T>(
  reducer: ReducerFun<F, T>,
  init: () => T,
  eq?: (a: T, b: T) => any) {
  return useReducer(reducer, undefined, init, eq)
}


export function createUseReducer<A, M, I = M>(
  reducer: ReducerFun<A, M>,
  initFun?: (i: I) => M,
  eq?: (a: M, b: M) => any
) {
  return function (init: I) {
    return useReducer(reducer, init, initFun || quote as any, eq)
  }
}

export function createUseReducerFun<A, M>(
  reducer: ReducerFun<A, M>,
  eq?: (a: M, b: M) => any
) {
  return function (initFun: () => M) {
    return useReducer(reducer, undefined, initFun, eq)
  }
}