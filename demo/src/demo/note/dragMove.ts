
import { addEffectDestroy, renderArray, useAtom, useChange, useChangeFun, useEffect, useEvent, useHookEffect, useMemo } from "better-react-helper";
import { Route, locationMatch } from "../util/createRouter";
import { renderPage } from "../util/page";
import { cacheVelocity, emptyArray, getSpringBaseAnimationConfig, PointKey, quote, run, scrollJudgeDirection, SetValue, syncMergeCenter, syncMergeCenterArray, trueAndS, YearMonthVirtualView } from "wy-helper";
import { idbOut } from "./idbUtil";
import { initDexieUtil } from "./dexieUtil";
import { LunarDay, SolarDay, SolarMonth, Week } from "tyme4ts";
import { dom } from "better-react-dom";
import { animateFrame, dragInit, PagePoint, subscribeDragInit, subscribeDragMove, subscribeMove } from "wy-dom-helper";


export type DragMessage = {
  type: "init"
  event: Event
  point: PagePoint
} | {
  type: "move"
  event: Event
  point: PagePoint
} | {
  type: "end"
  event: Event
}

const DIRECTION_LOCK_THRESHOLD = 5;
export function dragMovePageX(
  getContainer: () => HTMLDivElement,
  changeDirection: (direction: number) => void,
  changeY: (v: DragMessage) => void,
  changeDep: any
) {
  const { transX } = useMemo(() => {
    return {
      transX: animateFrame(0)
    }
  }, emptyArray)

  useEffect(() => {
    transX.slientChange(0)
  }, changeDep)
  const { velocityX, velocityY } = useMemo(() => {
    return {
      velocityX: cacheVelocity(),
      velocityY: cacheVelocity()
    }
  }, emptyArray)
  const updateDirection = useEvent((direction: number, velocity = 0) => {
    const width = getContainer().clientWidth
    if (direction < 0) {
      transX.changeTo(width, getSpringBaseAnimationConfig({ initialVelocity: velocity }))
    } else if (direction > 0) {
      transX.changeTo(-width, getSpringBaseAnimationConfig({ initialVelocity: velocity }))
    } else {
      transX.changeTo(0, getSpringBaseAnimationConfig({ initialVelocity: velocity }))
    }
  })
  const moveInfo = useAtom<PagePoint | undefined>(undefined)
  useHookEffect(() => {
    const container = getContainer()

    let initEvent: DragMessage = undefined!
    addEffectDestroy(subscribeDragInit(container, function (p, e) {
      velocityX.reset(e.timeStamp, p.pageX)
      velocityY.reset(e.timeStamp, p.pageY)
      moveInfo.set(p)
      initEvent = {
        type: "init",
        point: p,
        event: e
      }
    }))
    let directionLock: PointKey | undefined = undefined
    addEffectDestroy(subscribeDragMove(function (p, e) {
      const lastE = moveInfo.get()
      if (lastE) {
        if (p) {
          if (!directionLock) {
            const absX = Math.abs(p.pageX - lastE.pageX)
            const absY = Math.abs(p.pageY - lastE.pageY)
            if (absX > absY + DIRECTION_LOCK_THRESHOLD) {
              directionLock = 'x'
            } else if (absY >= absX + DIRECTION_LOCK_THRESHOLD) {
              directionLock = 'y'
              changeY(initEvent)
            }
          }
          velocityX.append(e.timeStamp, p.pageX)
          velocityY.append(e.timeStamp, p.pageY)
          if (directionLock == 'x') {
            const diff = p.pageX - lastE.pageX
            transX.changeTo(transX.get() + diff)
          }
          if (directionLock == 'y') {
            changeY({
              type: "move",
              event: e,
              point: p
            })
          }
        } else {
          if (directionLock == 'x') {
            const width = container.clientWidth
            const direction = scrollJudgeDirection(
              velocityX.get(),
              transX.get(),
              width)
            changeDirection(direction)
            updateDirection(direction, velocityX.get())
          }
          if (directionLock == 'y') {
            changeY({
              type: "end",
              event: e
            })
          }
        }
        if (directionLock) {
          moveInfo.set(p)
          if (!p) {
            directionLock = undefined
          }
        }
      }
    }))
    addEffectDestroy(syncMergeCenterArray([transX, transY], ([x, y]) => {
      container.style.transform = `translateX(${x}px)`;
    }))
  }, emptyArray)

  return updateDirection
}