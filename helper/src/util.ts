import {
  ParentSet,
  ReduceRowState,
  buildSubSetArray,
  buildSubSetArrayKey,
  buildSubSetObject,
  emptyArray,
} from "wy-helper";
import { useMemo } from "./useRef";

/**
 * 对react-setState的局部嵌套
 * @param parentSet
 * @param setChild
 * @param getChild
 * @param buildParent
 */
export function useBuildSubSetObject<
  PARENT extends object,
  K extends keyof PARENT,
>(
  parentSet: ParentSet<PARENT>,
  key: K,
  callback?: (v: PARENT[K], parent: PARENT) => PARENT[K],
) {
  return useMemo(() => buildSubSetObject(parentSet, key, callback), emptyArray);
}

export function useBuildSubSetArray<T>(
  parentSet: ParentSet<readonly T[]>,
  equal: (v: T) => boolean,
): ReduceRowState<T> {
  return useMemo(() => buildSubSetArray(parentSet, equal), emptyArray);
}

export function useBuildSubSetArrayKey<T, K>(
  parentSet: ParentSet<readonly T[]>,
  getKey: (v: T) => K,
  row: T,
) {
  return useMemo(() => buildSubSetArrayKey(parentSet, getKey, row), emptyArray);
}
