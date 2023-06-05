import { ReducerResult, useReducer } from "better-react";
type StateReducerState<T> = T | ((v: T) => T)
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
    return useReducer<any, any, any>(reducer, undefined, init)
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
