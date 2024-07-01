import { PointKey, ReadArray, Reorder, ReorderFixHeight, emptyArray, emptyObject, pointZero } from "wy-helper";
import { useMemo } from "./useRef";
import { useEffect } from "./useEffect";



export function useReorder<T, K>(
  list: ReadArray<T>,
  getKey: (v: T) => K,
  moveItem: (itemKey: K, baseKey: K) => void,
  axis?: PointKey,
  gap = 0
) {
  const rd = useMemo(() => {
    const rd = new Reorder(moveItem, axis, gap)
    return rd
  }, emptyArray)
  useEffect(() => {
    rd.updateLayoutList(moveItem, axis || 'y', list, getKey, gap)
  })
  return rd
}


export function useReorderFix<T, K>(
  list: ReadArray<T>,
  getKey: (v: T) => K,
  moveItem: (itemKey: K, baseKey: K) => void,
  height: number,
  endToMove?: boolean,
  axis?: PointKey,
  gap?: number
) {
  const rd = useMemo(() => new ReorderFixHeight(moveItem, axis, height, gap), emptyArray)
  useEffect(() => {
    rd.updateLayoutList(moveItem, axis || 'y', list, getKey, height, endToMove, gap)
  })
  return rd
}