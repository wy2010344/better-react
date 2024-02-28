import ActionsHandler from "../ActionsHandler"
import { EventEmitter } from "../utils/events"
import { Behavior } from "./Behavior"
import { OptionsConstructor as BScrollOptions } from '../Options'
import DirectionLockAction from "./DirectionLockAction"
import { Quadrant } from "../utils/enums"
import { Point } from "wy-helper"

export default class ScrollerActions {
  hooks: EventEmitter
  scrollBehaviorX: Behavior
  scrollBehaviorY: Behavior
  actionsHandler: ActionsHandler
  animater: Animater
  options: BScrollOptions
  directionLockAction: DirectionLockAction
  fingerMoved: boolean
  contentMoved: boolean
  enabled: boolean
  startTime: number
  endTime: number
  ensuringInteger: boolean
  constructor(
    scrollBehaviorX: Behavior,
    scrollBehaviorY: Behavior,
    actionsHandler: ActionsHandler,
    animater: Animater,
    options: BScrollOptions
  ) {
    this.hooks = new EventEmitter([
      'start',
      'beforeMove',
      'scrollStart',
      'scroll',
      'beforeEnd',
      'end',
      'scrollEnd',
      'contentNotMoved',
      'detectMovingDirection',
      'coordinateTransformation',
    ])

    this.scrollBehaviorX = scrollBehaviorX
    this.scrollBehaviorY = scrollBehaviorY
    this.actionsHandler = actionsHandler
    this.animater = animater
    this.options = options

    this.directionLockAction = new DirectionLockAction(
      options.directionLockThreshold,
      options.freeScroll,
      options.eventPassthrough
    )

    this.enabled = true

    this.bindActionsHandler()
  }


  private bindActionsHandler() {
    // [mouse|touch]start event
    this.actionsHandler.hooks.on(
      this.actionsHandler.hooks.eventTypes.start,
      (e: TouchEvent) => {
        if (!this.enabled) return true
        return this.handleStart(e)
      }
    )

    // [mouse|touch]move event
    this.actionsHandler.hooks.on(
      this.actionsHandler.hooks.eventTypes.move,
      ({
        deltaX,
        deltaY,
        e,
      }: {
        deltaX: number
        deltaY: number
        e: TouchEvent
      }) => {
        if (!this.enabled) return true

        const [transformateDeltaX, transformateDeltaY] =
          applyQuadrantTransformation(deltaX, deltaY, this.options.quadrant)
        const transformateDeltaData = {
          deltaX: transformateDeltaX,
          deltaY: transformateDeltaY,
        }

        this.hooks.trigger(
          this.hooks.eventTypes.coordinateTransformation,
          transformateDeltaData
        )

        return this.handleMove(
          transformateDeltaData.deltaX,
          transformateDeltaData.deltaY,
          e
        )
      }
    )

    // [mouse|touch]end event
    this.actionsHandler.hooks.on(
      this.actionsHandler.hooks.eventTypes.end,
      (e: TouchEvent) => {
        if (!this.enabled) return true
        return this.handleEnd(e)
      }
    )

    // click
    this.actionsHandler.hooks.on(
      this.actionsHandler.hooks.eventTypes.click,
      (e: TouchEvent) => {
        // handle native click event
        //_constructed是better-scroll派发的,判断在pc上是否点击事件.
        if (this.enabled && !(e as any)._constructed) {
          this.handleClick(e)
        }
      }
    )
  }



  private handleMove(deltaX: number, deltaY: number, e: TouchEvent) {
    if (this.hooks.trigger(this.hooks.eventTypes.beforeMove, e)) {
      return
    }

    const absDistX = this.scrollBehaviorX.getAbsDist(deltaX)
    const absDistY = this.scrollBehaviorY.getAbsDist(deltaY)
    const timestamp = getNow()

    // We need to move at least momentumLimitDistance pixels
    // for the scrolling to initiate
    if (this.checkMomentum(absDistX, absDistY, timestamp)) {
      return true
    }
    if (this.directionLockAction.checkMovingDirection(absDistX, absDistY, e)) {
      this.actionsHandler.setInitiated()
      return true
    }

    const delta = this.directionLockAction.adjustDelta(deltaX, deltaY)

    const prevX = this.scrollBehaviorX.getCurrentPos()
    const newX = this.scrollBehaviorX.move(delta.deltaX)
    const prevY = this.scrollBehaviorY.getCurrentPos()
    const newY = this.scrollBehaviorY.move(delta.deltaY)

    if (this.hooks.trigger(this.hooks.eventTypes.detectMovingDirection)) {
      return
    }

    if (!this.fingerMoved) {
      this.fingerMoved = true
    }

    const positionChanged = newX !== prevX || newY !== prevY

    if (!this.contentMoved && !positionChanged) {
      this.hooks.trigger(this.hooks.eventTypes.contentNotMoved)
    }

    if (!this.contentMoved && positionChanged) {
      this.contentMoved = true
      this.hooks.trigger(this.hooks.eventTypes.scrollStart)
    }

    if (this.contentMoved && positionChanged) {
      this.animater.translate({
        x: newX,
        y: newY,
      })

      this.dispatchScroll(timestamp)
    }
  }

  getCurrentPos(): Point {
    return {
      x: this.scrollBehaviorX.getCurrentPos(),
      y: this.scrollBehaviorY.getCurrentPos(),
    }
  }
}


const applyQuadrantTransformation = (
  deltaX: number,
  deltaY: number,
  quadrant: Quadrant
) => {
  if (quadrant === Quadrant.Second) {
    return [deltaY, -deltaX]
  } else if (quadrant === Quadrant.Third) {
    return [-deltaX, -deltaY]
  } else if (quadrant === Quadrant.Forth) {
    return [-deltaY, deltaX]
  } else {
    return [deltaX, deltaY]
  }
}