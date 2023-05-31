import { useMemo } from 'better-react'
import { ReduceState, SetStateAction } from './ValueCenter'

export * from './useFragment'
export * from './useGuard'
export * from './useOnlyId'
export * from './useRef'
export * from './ValueCenter'
export * from './Vue'
export * from './VueAdapter'
export * from './useEvent'
export * from './useRefState'
export * from './autoLoadMore'
export * from './useTransition'
export * from './usePrevious'
export * from './useVersion'
export * from './usePromise'
export * from './useState'
export * from './useCallback'
export * from './useInit'
export { compileSimpleRule, createMatch, pathExactly, pathStartWith, toAbsolutePath } from "./routes/util"
export { RouteContext, routeMatch, routeMathWithOther } from "./routes"


/**
 * 对react-setState的局部嵌套
 * @param parentSet 
 * @param setChild 
 * @param getChild 
 * @param buildParent 
 */
export function buildSubSet<PARENT, CHILD>(
  parentSet: ReduceState<PARENT>,
  getChild: (s: PARENT) => CHILD,
  buildParent: (s: PARENT, t: CHILD) => PARENT
) {
  return function (setChild: SetStateAction<CHILD>) {
    if (typeof (setChild) == 'function') {
      const call = setChild as (v: CHILD) => CHILD
      parentSet(x => buildParent(x, call(getChild(x))))
    } else {
      parentSet(x => buildParent(x, setChild))
    }
  }
}

export function buildSubSetObject<PARENT extends object, K extends keyof PARENT>(
  parentSet: ReduceState<PARENT>,
  key: K,
  callback?: (v: PARENT[K], parent: PARENT) => PARENT[K]
) {
  return buildSubSet(
    parentSet,
    v => v[key],
    (parent, sub) => {
      return {
        ...parent,
        [key]: callback ? callback(sub, parent) : sub
      }
    }
  )
}
export function useBuildSubSetObject<PARENT extends object, K extends keyof PARENT>(
  parentSet: ReduceState<PARENT>,
  key: K,
  callback?: (v: PARENT[K], parent: PARENT) => PARENT[K]
) {
  return useMemo(() => buildSubSetObject(parentSet, key, callback), [])
}

export type ReduceRowState<T> = (() => void) & ((v: SetStateAction<T>) => void)
export function buildSubSetArray<T>(
  parentSet: ReduceState<T[]>,
  equal: ((v: T) => boolean)
): ReduceRowState<T> {
  return function () {
    const isRemove = arguments.length == 0
    const v = arguments[0]
    parentSet(ts => {
      const idx = ts.findIndex(equal)
      if (idx < 0) {
        return ts
      }
      ts = ts.slice()
      if (isRemove) {
        ts.splice(idx, 1)
      } else {
        if (typeof (v) == 'function') {
          ts.splice(idx, 1, v(ts[idx]))
        } else {
          ts.splice(idx, 1, v)
        }
      }
      return ts
    })
  }
}

export function useBuildSubSetArray<T>(
  parentSet: ReduceState<T[]>,
  equal: ((v: T) => boolean)
): ReduceRowState<T> {
  return useMemo(() => buildSubSetArray(parentSet, equal), [])
}
