import { ReduceRowState, ReduceState, alawaysTrue, buildSubSetArray, buildSubSetObject } from "wy-helper"
import { useMemo } from "./useRef"
import { FiberConfig } from "better-react"

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

export function useBuildSubSetArray<T>(
  parentSet: ReduceState<T[]>,
  equal: ((v: T) => boolean)
): ReduceRowState<T> {
  return useMemo(() => buildSubSetArray(parentSet, equal), [])
}



export const fiberConfigAlawaysAllow: FiberConfig = {
  allowFiber: true,
  allowAdd: alawaysTrue,
}

export const fiberConfigAlawaysAllowGet = () => fiberConfigAlawaysAllow