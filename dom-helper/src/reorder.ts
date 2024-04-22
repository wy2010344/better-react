

import { useReorder as useBaseReorder, useEffect, useMemo } from "better-react-helper"
import { getDiffOnScroll, reorderChildChangeIndex } from "wy-dom-helper"
import { Box, EmptyFun, Point, ReorderChild, PointKey, emptyArray, ReadArray } from "wy-helper"


export function useReorder<T, K>(
  axis: PointKey,
  list: ReadArray<T>,
  getKey: (v: T) => K,
  moveItem: (itemKey: any, baseKey: any) => void
) {
  const rd = useBaseReorder(axis, list, getKey, moveItem)
  const data = useMemo(() => {
    return {
      end: rd.end.bind(rd),
      move: rd.move.bind(rd),
      onScroll: getDiffOnScroll(rd.setMoveDiff)
    }
  }, emptyArray)

  return {
    ...data,
    useChild(
      key: any,
      getDiv: () => HTMLElement,
      getTrans: () => Point,
      changeTo: (value: Point) => void,
      onLayout: (diff: Point) => void,
      updateBox?: (box: Box) => void
    ) {
      const child = useMemo(() => {
        return new ReorderChild(rd, key, getTrans, changeTo)
      }, emptyArray)
      useEffect(() => {
        return reorderChildChangeIndex(child, getDiv(), onLayout, updateBox)
      }, emptyArray)
      return function (loc: Point, onFinish: EmptyFun) {
        child.start(loc, onFinish)
      }
    }
  }
}