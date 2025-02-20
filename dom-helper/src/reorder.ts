

import {
  useReorder as useBaseReorder,
  useReorderFix as useBaseReorderFix,
  useEffect, useMemo
} from "better-react-helper"
import { reorderChildChangeIndex } from "wy-dom-helper"
import { Box, EmptyFun, Point, ReorderChild, PointKey, emptyArray, ReadArray, emptyObject, ReorderFixHeightChild } from "wy-helper"
export function useReorder<T, K>(
  list: ReadArray<T>,
  getKey: (v: T) => K,
  moveItem: (itemKey: any, baseKey: any) => void,
  {
    gap,
    axis
  }: {
    gap?: number
    axis?: PointKey,
  } = emptyObject
) {
  const rd = useBaseReorder(list, getKey, moveItem, axis, gap)
  return function (
    key: K,
    index: number,
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
    }, [index])
    return function (loc: Point,
      onFinish: EmptyFun) {
      child.start(loc, onFinish)
      return {
        end: rd.end.bind(rd),
        move: rd.move.bind(rd),
        setMoveDiff: rd.setMoveDiff.bind(rd)
      }
    }
  }
}


export function useReorderFix<T, K>(
  list: ReadArray<T>,
  getKey: (v: T) => K,
  height: number,
  moveItem: (itemKey: any, baseKey: any) => void,
  {
    axis,
    endToMove,
    gap
  }: {
    axis?: PointKey,
    endToMove?: boolean,
    gap?: number
  } = emptyObject
) {
  const rd = useBaseReorderFix(list, getKey, moveItem, height, endToMove, axis, gap)
  return function (
    key: K,
    getTrans: () => Point,
    layoutFrom: (n: number) => void,
    changeTo: (value: Point) => void,
    getOffset: () => number,
    setOffset: (n: number) => void
  ) {
    const child = useMemo(() => {
      return new ReorderFixHeightChild(rd, key, getTrans, changeTo, layoutFrom, getOffset, setOffset)
    }, emptyArray)
    return function (loc: Point, onFinish: EmptyFun) {
      child.start(loc, onFinish)
      return {
        end: rd.end.bind(rd),
        move: rd.move.bind(rd),
        setMoveDiff: rd.setMoveDiff.bind(rd)
      }
    }
  }
}