import { ReducerResult, useReducer } from "better-react";
type StateReducerState<T> = T | ((v: T) => T)
function reducer<T>(old: T, action: StateReducerState<T>) {
  if (typeof (action) == 'function') {
    return (action as any)(old)
  } else {
    return action
  }
}
export function useState<T = undefined>(): ReducerResult<StateReducerState<T | undefined>, T | undefined>
export function useState<T>(init: T | (() => T)): ReducerResult<StateReducerState<T>, T>
export function useState() {
  const [init] = arguments
  return useReducer<any, any>(reducer, typeof init == 'function' ? init : () => init)
}
function change<T>(old: T, action: T) {
  return action
}
export function useChange<T>(init: () => T): ReducerResult<T, T> {
  return useReducer(change, init)
}
export function useChangeWith<T = undefined>(): ReducerResult<T | undefined, T | undefined>
export function useChangeWith<T>(init: T): ReducerResult<T, T>
export function useChangeWith() {
  const [init] = arguments
  return useChange<any>(() => init)
}