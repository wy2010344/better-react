
import { addEffectDestroy, renderArray, useAtom, useChange, useChangeFun, useEffect, useEvent, useHookEffect, useMemo } from "better-react-helper";
import { Route, locationMatch } from "../util/createRouter";
import { renderPage } from "../util/page";
import { cacheVelocity, emptyArray, EmptyFun, getSpringBaseAnimationConfig, PointKey, quote, run, scrollJudgeDirection, SetValue, syncMergeCenter, syncMergeCenterArray, trueAndS, YearMonthVirtualView } from "wy-helper";
import { idbOut } from "./idbUtil";
import { initDexieUtil } from "./dexieUtil";
import { LunarDay, SolarDay, SolarMonth, Week } from "tyme4ts";
import { dom } from "better-react-dom";
import { animateFrame, dragInit, PagePoint, subscribeDragInit, subscribeDragMove, subscribeMove } from "wy-dom-helper";


export interface DragBMessage {
  event: Event
  point: PagePoint
}

export interface DragMessageMove extends DragBMessage {
  type: "move"
}
export type DragMessage = ({
  type: "init"
  event: Event
  point: PagePoint
} & DragBMessage) | DragMessageMove | {
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
  const updateDirection = useEvent((direction: number, velocity = 0, onFinish: EmptyFun) => {
    const width = getContainer().clientWidth
    if (direction < 0) {
      transX.changeTo(width, getSpringBaseAnimationConfig({ initialVelocity: velocity }), {
        onProcess(v) {
          if (v > width * 6 / 7) {
            onFinish()
          }
        },
        // onFinish
      })
    } else if (direction > 0) {
      transX.changeTo(-width, getSpringBaseAnimationConfig({ initialVelocity: velocity }), {
        onProcess(v) {
          if (v < -width * 6 / 7) {
            onFinish()
          }
        },
        // onFinish
      })
    } else {
      transX.changeTo(0, getSpringBaseAnimationConfig({ initialVelocity: velocity }), {
        onFinish
      })
    }
  })
  const moveInfo = useAtom<PagePoint | undefined>(undefined)
  useHookEffect(() => {
    const container = getContainer()

    const velocityX = cacheVelocity()
    let initEvent: DragMessage = undefined!
    addEffectDestroy(subscribeDragInit(container, function (p, e) {
      moveInfo.set(p)
      velocityX.reset(e.timeStamp, p.pageX)
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
          if (directionLock == 'x') {
            const diff = p.pageX - lastE.pageX
            velocityX.append(e.timeStamp, p.pageX)
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
            updateDirection(direction, velocityX.get(), () => {
              changeDirection(direction)
            })
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
  }, emptyArray)

  return [transX, updateDirection] as const
}




