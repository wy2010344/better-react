import { useAtom, useEffect, useMemo, useTimeoutAnimateValue } from "better-react-helper"
import { forceFlow, getPageOffset, subscribeRequestAnimationFrame } from "wy-dom-helper"
import { Axis, Box, EmptyFun, Point, Reorder, axisEqual, emptyArray, emptyObject, mixNumber, pointZero, removeWhere } from "wy-helper"




export function useReorder(
  axis: 'x' | 'y',
  shouldRemove: (key: any) => boolean,
  moveItem: (itemKey: any, baseKey: any) => void
) {
  const { rd, end, move, onScroll } = useMemo(() => {
    const rd = new Reorder(moveItem)
    let lastScroll = pointZero
    return {
      rd,
      end: rd.end.bind(rd),
      move: rd.move.bind(rd),
      onScroll(container: HTMLElement) {
        const top = container.scrollTop
        const left = container.scrollLeft
        const diffY = top - lastScroll.y
        const diffX = left - lastScroll.x
        rd.setMoveDiff({
          x: diffX,
          y: diffY
        })
        lastScroll = {
          x: left,
          y: top
        }
      }
    }
  }, emptyArray)
  useEffect(() => {
    rd.updateLayoutList(axis, shouldRemove)
  })
  useEffect(() => {
    end(pointZero)
  }, [axis])
  return {
    end,
    move,
    onScroll,
    useChild(
      key: any,
      index: number,
      getDiv: () => HTMLElement,
      getTrans: () => Point,
      changeTo: (value: Point) => void,
      onLayout: (diff: Point) => void,
      config: {
        updateBox?(box: Box): void
      } = emptyObject
    ) {
      const { child, getBox, setMoveDiff } = useMemo(() => {
        const child = rd.getChild(key, getTrans, changeTo)

        return {
          setMoveDiff: child.setMoveDiff.bind(child),
          getBox: child.getBox.bind(child),
          child: child
        }
      }, emptyArray)
      useEffect(() => {
        function animateFrmae() {
          const axisV = getLayoutData(getDiv())
          config.updateBox?.(axisV)
          child.animateFrame(axisV, onLayout)
        }
        animateFrmae()
        child.releaseLock()
        return subscribeRequestAnimationFrame(animateFrmae)
      }, [index])
      return {
        setMoveDiff,
        getBox,
        start(loc: Point, onFinish: EmptyFun) {
          child.start(loc, onFinish)
        }
      }
    }
  }
}


function getLayoutData(div: HTMLElement) {
  const loc = getPageOffset(div)
  const width = div.clientWidth
  const height = div.clientHeight
  const newB: Box = {
    x: {
      min: loc.x,
      max: loc.x + width
    },
    y: {
      min: loc.y,
      max: loc.y + height
    }
  }
  return newB
}