import { ReducerResult } from "better-react";
import { useReducer } from "./useReducer";
import { RefReducerResult, useRefReducer } from "./useRefReducer";
import { RWValue, initRWValue, run } from "wy-helper";



export type StateReducerState<T> = T | ((v: T) => T)
function reducer<T>(old: T, action: StateReducerState<T>) {
  if (typeof (action) == 'function') {
    return (action as any)(old)
  } else {
    return action
  }
}

/**
 * useState的特殊性,不能存储函数
 */
export function useState<T = undefined>(): ReducerResult<StateReducerState<T | undefined>, T | undefined>
export function useState<M, T>(init: M, trans: (v: M) => T): ReducerResult<StateReducerState<T>, T>
export function useState<T>(init: T | (() => T)): ReducerResult<StateReducerState<T>, T>
export function useState() {
  const [init, trans] = arguments
  if (typeof (init) == 'function') {
    return useReducer<any, any, any>(reducer, init, run)
  } else {
    return useReducer<any, any, any>(reducer, init, trans)
  }
}

function change<T>(old: T, action: T) {
  return action
}

export function useChange<T = undefined>(): ReducerResult<T | undefined, T | undefined>
export function useChange<M, T>(v: M, init: (v: M) => T): ReducerResult<T, T>
export function useChange<T>(v: T): ReducerResult<T, T>
export function useChange<T>(): ReducerResult<T, T> {
  const [init, trans] = arguments
  return useReducer(change, init, trans)
}

export function useChangeFun<T>(fun: () => T): ReducerResult<T, T> {
  return useChange(undefined, fun)
}

type RefValueOut<T> = [T, RWValue<T>]
export function useRefValue<T = undefined>(): RefValueOut<T | undefined>
export function useRefValue<M, T>(v: M, init: (v: M) => T): RefValueOut<T>
export function useRefValue<T>(v: T): RefValueOut<T>
export function useRefValue() {
  return useRefReducer(initRef, change, arguments[0], arguments[1])
}
export function useRefValueFun<T>(fun: () => T): RefValueOut<T> {
  return useRefValue(undefined, fun)
}

function initRef<T>(value: T, callback: (f: T) => T) {
  function setValue(v: T) {
    value = callback(v)
  }
  return initRWValue(setValue, () => value)
}