import { hookCreateChangeAtom, hookRequestReconcile } from "better-react";
import { EmptyFun, Reducer, ReducerWithDispatch, SetValue, emptyArray, quote, simpleEqual } from "wy-helper";
import { useMemo } from "./useRef";
type EffectArray = readonly [number, EmptyFun][]
export type ReducerResult<F, T> = [T, (f: F, effects?: EffectArray) => void];

export function useSideReducer<F, M, T>(
  reducer: ReducerWithDispatch<T, F>,
  init: M,
  initFun: (m: M) => T,
  eq?: (a: T, b: T) => any,
  sideCall?: SideCall<F>): ReducerResult<F, T>;
export function useSideReducer<F, T>(
  reducer: ReducerWithDispatch<T, F>,
  init: T,
  initFun?: (m: T) => T,
  eq?: (a: T, b: T) => any,
  sideCall?: SideCall<F>
): ReducerResult<F, T>;
export function useSideReducer<F, T = undefined>(
  reducer: ReducerWithDispatch<T, F>,
  init?: T,
  initFun?: (m: T) => T,
  eq?: (a: T, b: T) => any,
  sideCall?: SideCall<F>): ReducerResult<F, T>
export function useSideReducer(reducer: any, init: any, initFun: any, eq: any, sideCall?: any) {
  return useBaseReducer(reducer, init, initFun, eq, sideCall || defaultSideCall)
}

type SideCall<F> = (updateEffect: (level: number, effect: EmptyFun) => void, fun: SetValue<SetValue<F>>, set: SetValue<F>) => void
function defaultSideCall<F>(updateEffect: (level: number, effect: EmptyFun) => void, fun: SetValue<SetValue<F>>, set: SetValue<F>,) {
  updateEffect(1, function () {
    fun(set)
  })
}

function useBaseReducer(reducer: any, init: any, initFun: any, eq: any, sideCall?: any) {
  const createChangeAtom = hookCreateChangeAtom()
  const reconcile = hookRequestReconcile()
  const hook = useMemo(() => {
    /**
     * 这个memo不能像jetpack compose一样依赖key变化,因为是异步生效的
     */
    const realEq = eq || simpleEqual
    const trans = initFun || quote
    const initData = trans(init)
    const value = createChangeAtom(initData)
    function set(action: any, effects: EffectArray = emptyArray as any) {
      reconcile(function (updateEffect) {
        const oldValue = value.get()
        let newValue = reducer(oldValue, action)
        if (sideCall) {
          const fun = newValue[1]
          newValue = newValue[0]
          if (fun) {
            //只能这样做!!!!
            sideCall(updateEffect, fun, set)
          }
        }
        effects.forEach(effect => {
          updateEffect(effect[0], effect[1])
        })
        //这里,合并多次,如果动作被执行了
        if (!realEq(oldValue, newValue)) {
          value.set(newValue)
          // value.set(objectDeepFreeze(newValue))
          return true
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
  const data = hook.value.get()
  return [data, hook.set]
}

export function effectSetPromise<F>(
  fun: (f: F, effects?: EffectArray) => void,
  f: F,
  level = 0
) {
  return new Promise(resolve => {
    fun(f, [[level, resolve]])
  })
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

export function createUseSideReducer<A, M, I = M>(
  reducer: ReducerWithDispatch<M, A>,
  initFun?: (i: I) => M,
  eq?: (a: M, b: M) => any
) {
  return function (init: I) {
    return useSideReducer(reducer, init, initFun || quote as any, eq)
  }
}

export function createUseSideReducerFun<A, M>(
  reducer: ReducerWithDispatch<M, A>,
  eq?: (a: M, b: M) => any
) {
  return function (initFun: () => M) {
    return useSideReducer(reducer, undefined, initFun, eq)
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
  return useBaseReducer(reducer, init, initFun, eq)
}
