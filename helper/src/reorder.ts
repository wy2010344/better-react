import { PointKey, Reorder, emptyArray, pointZero } from "wy-helper";
import { useMemo } from "./useRef";
import { useEffect } from "./useEffect";



export function useReorder(
  axis: PointKey,
  shouldRemove: (key: any) => boolean,
  moveItem: (itemKey: any, baseKey: any) => void
) {
  const rd = useMemo(() => {
    const rd = new Reorder(moveItem)
    return rd
  }, emptyArray)
  useEffect(() => {
    rd.updateLayoutList(axis, shouldRemove)
  })
  useEffect(() => {
    rd.end(pointZero)
  }, [axis])
  return rd
}