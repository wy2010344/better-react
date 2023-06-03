import { useReducer } from "better-react";
import { ReducerFun } from "better-react";



export function useReducerFun<F, T>(reducer: ReducerFun<F, T>, init: () => T) {
  return useReducer(reducer, undefined, init)
}