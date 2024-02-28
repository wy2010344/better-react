import { getRect } from "../utils/dom"
import { Direction } from "../utils/enums"
import { EventEmitter } from "../utils/events"


export type Bounces = [boolean, boolean]
export type Rect = { size: 'width' | 'height'; position: 'top' | 'left' }

export type Boundary = {
  minScrollPos: number;
  maxScrollPos: number
}

export interface Options {
  scrollable: boolean
  momentum: boolean
  momentumLimitTime: number
  momentumLimitDistance: number
  deceleration: number
  swipeBounceTime: number
  swipeTime: number
  bounces: Bounces
  rect: Rect
  outOfBoundaryDampingFactor: number
  specifiedIndexAsContent: number
  [key: string]: number | boolean | Bounces | Rect
}


export class Behavior {
  content: HTMLElement = null!
  //当前位置
  currentPos: number = 0
  startPos: number = 0
  absStartPos: number = 0
  dist: number = 0
  minScrollPos: number = 0
  maxScrollPos: number = 0
  hasScroll: boolean = false
  direction: number = 0
  movingDirection: number = 0
  relativeOffset: number = 0
  wrapperSize: number = 0
  contentSize: number = 0
  hooks: EventEmitter
  constructor(
    public wrapper: HTMLElement,
    content: HTMLElement,
    public options: Options
  ) {
    this.hooks = new EventEmitter([
      'beforeComputeBoundary',
      'computeBoundary',
      'momentum',
      'end',
      'ignoreHasScroll'
    ])
    this.refresh(content)
  }
  start() {
    this.dist = 0
    this.setMovingDirection(Direction.Default)
    this.setDirection(Direction.Default)
  }
  move(delta: number) {
    delta = this.hasScroll ? delta : 0
    this.setMovingDirection(delta)
    return this.performDampingAlgorithm(
      delta,
      this.options.outOfBoundaryDampingFactor
    )
  }

  end(duration: number) {
    let momentumInfo: {
      destination?: number
      duration?: number
    } = {
      duration: 0
    }

    const absDist = Math.abs(this.currentPos - this.startPos)
    // start momentum animation if needed
    if (
      this.options.momentum &&
      duration < this.options.momentumLimitTime &&
      absDist > this.options.momentumLimitDistance
    ) {
      const wrapperSize =
        (this.direction === Direction.Negative && this.options.bounces[0]) ||
          (this.direction === Direction.Positive && this.options.bounces[1])
          ? this.wrapperSize
          : 0

      momentumInfo = this.hasScroll
        ? this.momentum(
          this.currentPos,
          this.startPos,
          duration,
          this.maxScrollPos,
          this.minScrollPos,
          wrapperSize,
          this.options
        )
        : { destination: this.currentPos, duration: 0 }
    } else {
      this.hooks.trigger(this.hooks.eventTypes.end, momentumInfo)
    }
    return momentumInfo
  }

  /**
   * 动量
   * @param current 
   * @param start 
   * @param time 
   * @param lowerMargin 
   * @param upperMargin 
   * @param wrapperSize 
   * @param options 
   * @returns 
   */
  private momentum(
    current: number,
    start: number,
    time: number,
    lowerMargin: number,
    upperMargin: number,
    wrapperSize: number,
    options = this.options
  ) {
    const distance = current - start
    const speed = Math.abs(distance) / time

    const { deceleration, swipeBounceTime, swipeTime } = options
    const duration = Math.min(swipeTime, (speed * 2) / deceleration)
    const momentumData = {
      destination:
        current + ((speed * speed) / deceleration) * (distance < 0 ? -1 : 1),
      duration,
      rate: 15
    }

    this.hooks.trigger(this.hooks.eventTypes.momentum, momentumData, distance)

    if (momentumData.destination < lowerMargin) {
      momentumData.destination = wrapperSize
        ? Math.max(
          lowerMargin - wrapperSize / 4,
          lowerMargin - (wrapperSize / momentumData.rate) * speed
        )
        : lowerMargin
      momentumData.duration = swipeBounceTime
    } else if (momentumData.destination > upperMargin) {
      momentumData.destination = wrapperSize
        ? Math.min(
          upperMargin + wrapperSize / 4,
          upperMargin + (wrapperSize / momentumData.rate) * speed
        )
        : upperMargin
      momentumData.duration = swipeBounceTime
    }
    momentumData.destination = Math.round(momentumData.destination)

    return momentumData
  }
  /**
   * 当拖拽到边界时,减少位移
   * @param delta 
   * @param dampingFactor 
   * @returns 
   */
  performDampingAlgorithm(delta: number, dampingFactor: number): number {
    let newPos = this.currentPos + delta
    // Slow down or stop if outside of the boundaries
    if (newPos > this.minScrollPos || newPos < this.maxScrollPos) {
      if (
        (newPos > this.minScrollPos && this.options.bounces[0]) ||
        (newPos < this.maxScrollPos && this.options.bounces[1])
      ) {
        newPos = this.currentPos + delta * dampingFactor
      } else {
        newPos =
          newPos > this.minScrollPos ? this.minScrollPos : this.maxScrollPos
      }
    }
    return newPos
  }


  refresh(content: HTMLElement) {
    const { size, position } = this.options.rect
    const isWrapperStatic =
      window.getComputedStyle(this.wrapper, null).position === 'static'
    // Force reflow
    const wrapperRect = getRect(this.wrapper)
    // use client is more fair than offset
    this.wrapperSize = this.wrapper[
      size === 'width' ? 'clientWidth' : 'clientHeight'
    ]
    this.setContent(content)
    const contentRect = getRect(this.content)
    this.contentSize = contentRect[size]

    this.relativeOffset = contentRect[position]
    /* istanbul ignore if  */
    if (isWrapperStatic) {
      this.relativeOffset -= wrapperRect[position]
    }

    this.computeBoundary()
    this.setDirection(Direction.Default)
  }

  private setContent(content: HTMLElement) {
    if (content !== this.content) {
      this.content = content
      this.resetState()
    }
  }

  private resetState() {
    this.currentPos = 0
    this.startPos = 0
    this.dist = 0
    this.setDirection(Direction.Default)
    this.setMovingDirection(Direction.Default)
    this.resetStartPos()
  }

  computeBoundary() {
    this.hooks.trigger(this.hooks.eventTypes.beforeComputeBoundary)

    const boundary: Boundary = {
      minScrollPos: 0,
      maxScrollPos: this.wrapperSize - this.contentSize
    }
    if (boundary.maxScrollPos < 0) {
      boundary.maxScrollPos -= this.relativeOffset
      if (this.options.specifiedIndexAsContent === 0) {
        boundary.minScrollPos = -this.relativeOffset
      }
    }
    this.hooks.trigger(this.hooks.eventTypes.computeBoundary, boundary)

    this.minScrollPos = boundary.minScrollPos
    this.maxScrollPos = boundary.maxScrollPos

    this.hasScroll =
      this.options.scrollable && this.maxScrollPos < this.minScrollPos

    if (!this.hasScroll && this.minScrollPos < this.maxScrollPos) {
      this.maxScrollPos = this.minScrollPos
      this.contentSize = this.wrapperSize
    }
  }

  setDirection(delta: number) {
    this.direction =
      delta > 0
        ? Direction.Negative
        : delta < 0
          ? Direction.Positive
          : Direction.Default
  }

  setMovingDirection(delta: number) {
    this.movingDirection =
      delta > 0
        ? Direction.Negative
        : delta < 0
          ? Direction.Positive
          : Direction.Default
  }

  resetStartPos() {
    this.updateStartPos()
    this.updateAbsStartPos()
  }

  updateStartPos() {
    this.startPos = this.currentPos
  }

  updateAbsStartPos() {
    this.absStartPos = this.currentPos
  }


  getCurrentPos() {
    return this.currentPos
  }


  /**
   * 检查是否在边界
   * @returns 
   */
  checkInBoundary() {
    const position = this.adjustPosition(this.currentPos)
    const inBoundary = position == this.getCurrentPos()
    return {
      position,
      inBoundary
    }
  }

  adjustPosition(pos: number) {
    if (
      !this.hasScroll &&
      !this.hooks.trigger(this.hooks.eventTypes.ignoreHasScroll)
    ) {
      pos = this.minScrollPos
    } else if (pos > this.minScrollPos) {
      pos = this.minScrollPos
    } else if (pos < this.maxScrollPos) {
      pos = this.maxScrollPos
    }
    return pos
  }
}