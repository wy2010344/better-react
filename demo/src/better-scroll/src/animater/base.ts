import { Point } from "wy-helper"
import Translater from "../Translater"
import { safeCSSStyleDeclaration } from "../utils/dom"
import { EaseFn } from "../utils/ease"
import { EventEmitter } from "../utils/events"

export interface ExposedAPI {
  stop(): void
}

export default abstract class Base implements ExposedAPI {
  content: HTMLElement = null!
  style: safeCSSStyleDeclaration = null!
  hooks: EventEmitter = null!
  timer: number = 0
  pending: boolean = false
  callStopWhenPending: boolean = false
  forceStopped: boolean = false
  _reflow: number = 0
  constructor(
    content: HTMLElement,
    public translater: Translater,
    public options: {
      probeType: number
    }
  ) {
    this.hooks = new EventEmitter([
      'move',
      'end',
      'beforeForceStop',
      'forceStop',
      'callStop',
      'time',
      'timeFunction',
    ])
    this.setContent(content)
  }


  translate(endPoint: Point) {
    this.translater.translate(endPoint)
  }

  setPending(pending: boolean) {
    this.pending = pending
  }

  setForceStopped(forceStopped: boolean) {
    this.forceStopped = forceStopped
  }

  setCallStop(called: boolean) {
    this.callStopWhenPending = called
  }
  setContent(content: HTMLElement) {
    if (this.content !== content) {
      this.content = content
      this.style = content.style as safeCSSStyleDeclaration
      this.stop()
    }
  }
  clearTimer() {
    if (this.timer) {
      cancelAnimationFrame(this.timer)
      this.timer = 0
    }
  }

  abstract move(
    startPoint: Point,
    endPoint: Point,
    time: number,
    easing: string | EaseFn
  ): void
  abstract doStop(): void
  abstract stop(): void

  destroy() {
    this.hooks.destroy()

    cancelAnimationFrame(this.timer)
  }
}