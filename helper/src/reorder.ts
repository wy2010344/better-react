import { PointKey, ReadArray, Reorder, emptyArray, pointZero } from "wy-helper";
import { useMemo } from "./useRef";
import { useEffect } from "./useEffect";



export function useReorder<T, K>(
  axis: PointKey,
  list: ReadArray<T>,
  getKey: (v: T) => K,
  moveItem: (itemKey: K, baseKey: K) => void
) {
  const rd = useMemo(() => {
    const rd = new Reorder(moveItem)
    return rd
  }, emptyArray)
  useEffect(() => {
    rd.updateLayoutList(axis, list, getKey)
  })
  useEffect(() => {
    rd.end(pointZero)
  }, [axis])
  return rd
}