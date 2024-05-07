
import { useAtom, useEffect, useEvent } from "better-react-helper"
import { getPageOffset, subscribeRequestAnimationFrame } from "wy-dom-helper"
import { Point, emptyArray, pointEqual } from "wy-helper"




export function usePageOffsetChange(div: HTMLElement, callback: (newOffset: Point, oldOffset?: Point) => void) {
  const lastPoint = useAtom<Point | undefined>(undefined)
  const realCB = useEvent(callback)
  useEffect(() => {
    return subscribeRequestAnimationFrame(function () {
      const offset = getPageOffset(div)
      const lp = lastPoint.get()
      if (lp) {
        if (!pointEqual(offset, lp)) {
          realCB(offset, lp)
          lastPoint.set(offset)
        }
      } else {
        realCB(offset)
        lastPoint.set(offset)
      }
    })
  }, emptyArray)

}

export function usePageOffsetChangeMany<T, K>(
  data: IterableIterator<T>,
  getKey: (v: T) => K,
  getElement: (v: T) => HTMLElement,
  callback: (changeMap: Map<K, [Point, Point | undefined]>) => void
) {
  const lastPoint = useAtom<Map<K, Point | undefined>>(undefined as any)
  const realCB = useEvent(callback)
  useEffect(() => {
    lastPoint.set(new Map())
    return subscribeRequestAnimationFrame(function () {
      const oldMap = lastPoint.get()
      let n = data.next()
      const newMap = new Map<K, Point>()
      const changeMap = new Map<K, [Point, Point | undefined]>()
      while (!n.done) {
        const key = getKey(n.value)
        const div = getElement(n.value)
        const offset = getPageOffset(div)
        const lp = oldMap.get(key)
        newMap.set(key, offset)
        if (lp) {
          if (!pointEqual(offset, lp)) {
            changeMap.set(key, [offset, lp])
          }
        } else {
          changeMap.set(key, [offset, undefined])
        }
        n = data.next()
      }
      lastPoint.set(newMap)
      if (changeMap.size) {
        realCB(changeMap)
      }
    })
  }, emptyArray)

}