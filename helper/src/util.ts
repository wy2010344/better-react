import { ReduceState, SetStateAction, buildSubSetObject } from "wy-helper"
import { useMemo } from "./useRef"

/**
 * 对react-setState的局部嵌套
 * @param parentSet 
 * @param setChild 
 * @param getChild 
 * @param buildParent 
 */
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

