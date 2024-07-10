
import { addEffectDestroy, renderArray, useAtom, useChange, useChangeFun, useEffect, useEvent, useHookEffect, useMemo } from "better-react-helper";
import { Route, locationMatch } from "../util/createRouter";
import { renderPage } from "../util/page";
import { cacheVelocity, emptyArray, getSpringBaseAnimationConfig, PointKey, quote, run, scrollJudgeDirection, SetValue, syncMergeCenter, syncMergeCenterArray, trueAndS, YearMonthVirtualView } from "wy-helper";
import { idbOut } from "./idbUtil";
import { initDexieUtil } from "./dexieUtil";
import { LunarDay, SolarDay, SolarMonth, Week } from "tyme4ts";
import { dom } from "better-react-dom";
import { animateFrame, dragInit, PagePoint, subscribeDragInit, subscribeDragMove, subscribeMove } from "wy-dom-helper";



const DIRECTION_LOCK_THRESHOLD = 5;
export function dragMovePageX(
  getContainer: () => HTMLDivElement,
  changeDirection: (direction: number) => void,
  changeDep: any
) {
  const { transX, transY } = useMemo(() => {
    return {
      transX: animateFrame(0),
      transY: animateFrame(0)
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
    addEffectDestroy(subscribeDragInit(container, function (p, e) {
      velocityX.reset(e.timeStamp, p.pageX)
      velocityY.reset(e.timeStamp, p.pageY)
      moveInfo.set(p)
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
            }
          }
          velocityX.append(e.timeStamp, p.pageX)
          velocityY.append(e.timeStamp, p.pageY)
          if (directionLock == 'x') {
            const diff = p.pageX - lastE.pageX
            transX.changeTo(transX.get() + diff)
          }
          if (directionLock == 'y') {
            const diff = p.pageY - lastE.pageY

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