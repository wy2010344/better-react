import { EaseItem, ease } from "../utils/ease";
import { EventEmitter, EventRegister } from "../utils/events";
import { OptionsConstructor as BScrollOptions } from '../Options'
import { Behavior } from "./Behavior";
import { createActionsHandlerOptions, createBehaviorOptions } from "./createOptions";
import Translater from "../Translater";
import createAnimater, { Animater } from "../animater";
import ActionsHandler from "../ActionsHandler";
import ScrollerActions from "./Actions";
import { isAndroid, isIOSBadVersion } from "../utils/env";
import { style } from "../utils/dom";
import { Probe } from "../utils/enums";
import { forceFlow } from "wy-dom-helper";
import { Point } from "wy-helper";
import { isSamePoint } from "../utils/compare";
import Transition from "/Users/wyknmjj/Documents/GitHub/better-react/demo/src/better-scroll/src/animater/Transition";
import { bubbling } from "../utils/bubbling";
import { getNow } from "../utils/lang";
import { MountedBScrollHTMLElement } from "../BScroll";

export interface ExposedAPI {
  scrollTo(
    point: Point,
    time?: number,
    easing?: EaseItem,
    extraTransform?: { start: object; end: object }
  ): void
  scrollBy(
    deltaX: number,
    deltaY: number,
    time?: number,
    easing?: EaseItem
  ): void
  scrollToElement(
    el: HTMLElement | string,
    time: number,
    offsetX: number | boolean,
    offsetY: number | boolean,
    easing?: EaseItem
  ): void
  resetPosition(time?: number, easing?: EaseItem): boolean
}


const MIN_SCROLL_DISTANCE = 1
export default class Scroller implements ExposedAPI {
  hooks: EventEmitter
  options: BScrollOptions
  actionsHandler: ActionsHandler
  scrollBehaviorX: Behavior
  scrollBehaviorY: Behavior
  translater: Translater;
  animater: Animater
  actions: ScrollerActions;
  resizeRegister: EventRegister;
  transitionEndRegister!: EventRegister;
  constructor(
    public wrapper: HTMLElement,
    public content: HTMLElement,
    options: BScrollOptions
  ) {
    this.hooks = new EventEmitter([
      'beforeStart',
      'beforeMove',
      'beforeScrollStart',
      'scrollStart',
      'scroll',
      'beforeEnd',
      'scrollEnd',
      'resize',
      'touchEnd',
      'end',
      'flick',
      'scrollCancel',
      'momentum',
      'scrollTo',
      'minDistanceScroll',
      'scrollToElement',
      'beforeRefresh',
    ])
    this.options = options
    const { left, right, top, bottom } = this.options.bounce
    // direction X
    this.scrollBehaviorX = new Behavior(
      wrapper,
      content,
      createBehaviorOptions(options, 'scrollX', [left, right], {
        size: 'width',
        position: 'left',
      })
    )
    // direction Y
    this.scrollBehaviorY = new Behavior(
      wrapper,
      content,
      createBehaviorOptions(options, 'scrollY', [top, bottom], {
        size: 'height',
        position: 'top',
      })
    )

    this.translater = new Translater(this.content)

    this.animater = createAnimater(this.content, this.translater, this.options)

    this.actionsHandler = new ActionsHandler(
      this.options.bindToTarget ? this.content : wrapper,
      createActionsHandlerOptions(this.options)
    )


    this.actions = new ScrollerActions(
      this.scrollBehaviorX,
      this.scrollBehaviorY,
      this.actionsHandler,
      this.animater,
      this.options
    )

    const resizeHandler = this.resize.bind(this)
    this.resizeRegister = new EventRegister(window, [
      {
        name: 'orientationchange',
        handler: resizeHandler,
      },
      {
        name: 'resize',
        handler: resizeHandler,
      },
    ])
    this.registerTransitionEnd()

    this.init()
  }
  registerTransitionEnd() {
    this.transitionEndRegister = new EventRegister(this.content, [
      {
        name: style.transitionEnd,
        handler: this.transitionEnd.bind(this),
      },
    ])
  }

  transitionEnd(e: TouchEvent) {
    if (e.target !== this.content || !this.animater.pending) {
      return
    }
    const animater = this.animater as Transition
    animater.transitionTime()
    if (!this.resetPosition(this.options.bounceTime, ease.bounce)) {
      this.animater.setPending(false)
      if (this.options.probeType !== Probe.Realtime) {
        this.hooks.trigger(
          this.hooks.eventTypes.scrollEnd,
          this.getCurrentPos()
        )
      }
    }
  }
  getCurrentPos() {
    return this.actions.getCurrentPos()
  }

  /**
   * 如果没溢出,返回false
   * 如果溢出了,恢复到正确位置
   * @param time 
   * @param easing 
   * @returns 
   */
  resetPosition(time: number = 0, easing: EaseItem = ease.bounce): boolean {
    const {
      position: x,
      inBoundary: xInBoundary,
    } = this.scrollBehaviorX.checkInBoundary()
    const {
      position: y,
      inBoundary: yInBoundary,
    } = this.scrollBehaviorY.checkInBoundary()

    if (xInBoundary && yInBoundary) {
      return false
    }

    /* istanbul ignore if  */
    if (isIOSBadVersion) {
      // fix ios 13.4 bouncing
      // see it in issues 982
      forceFlow(this.content)
    }
    // out of boundary
    this.scrollTo({ x, y }, time, easing)

    return true
  }



  scrollTo(endPoint: Point, time = 0, easing = ease.bouncing) {
    const easingFn = this.options.useTransition ? easing.style : easing.fn
    const currentPos = this.getCurrentPos()
    const startPoint = {
      x: currentPos.x,
      y: currentPos.y
    }
    this.hooks.trigger(this.hooks.eventTypes.scrollTo, endPoint)
    if (isSamePoint(startPoint, endPoint)) {
      return
    }
    const deltaX = Math.abs(endPoint.x - startPoint.x)
    const deltaY = Math.abs(endPoint.y - startPoint.y)

    if (deltaX < MIN_SCROLL_DISTANCE && deltaY < MIN_SCROLL_DISTANCE) {
      time = 0
      this.hooks.trigger(this.hooks.eventTypes.minDistanceScroll)
    }
    this.animater.move(startPoint, endPoint, time, easingFn)
  }

  init() {
    this.bindTranslater()
    this.bindAnimater()
    this.bindActions()
    // enable pointer events when scrolling ends
    this.hooks.on(this.hooks.eventTypes.scrollEnd, () => {
      this.togglePointerEvents(true)
    })
  }
  togglePointerEvents(enabled = true) {
    let el = this.content.children.length
      ? this.content.children
      : [this.content]
    let pointerEvents = enabled ? 'auto' : 'none'
    for (let i = 0; i < el.length; i++) {
      let node = el[i] as MountedBScrollHTMLElement
      // ignore BetterScroll instance's wrapper DOM
      /* istanbul ignore if  */
      if (node.isBScrollContainer) {
        continue
      }
      node.style.pointerEvents = pointerEvents
    }
  }

  private bindTranslater() {
    const hooks = this.translater.hooks
    hooks.on(hooks.eventTypes.beforeTranslate, (transformStyle: string[]) => {
      /**
       * 主要是外部有translateZ,补充进去
       */
      if (this.options.translateZ) {
        transformStyle.push(this.options.translateZ)
      }
    })
  }

  private bindAnimater() {
    // reset position
    this.animater.hooks.on(
      this.animater.hooks.eventTypes.end,
      (pos: Point) => {
        if (!this.resetPosition(this.options.bounceTime)) {
          this.animater.setPending(false)
          this.hooks.trigger(this.hooks.eventTypes.scrollEnd, pos)
        }
      }
    )
  }
  private bindActions() {
    const actions = this.actions

    bubbling(actions.hooks, this.hooks, [
      {
        source: actions.hooks.eventTypes.start,
        target: this.hooks.eventTypes.beforeStart,
      },
      {
        source: actions.hooks.eventTypes.start,
        target: this.hooks.eventTypes.beforeScrollStart, // just for event api
      },
      {
        source: actions.hooks.eventTypes.beforeMove,
        target: this.hooks.eventTypes.beforeMove,
      },
      {
        source: actions.hooks.eventTypes.scrollStart,
        target: this.hooks.eventTypes.scrollStart,
      },
      {
        source: actions.hooks.eventTypes.scroll,
        target: this.hooks.eventTypes.scroll,
      },
      {
        source: actions.hooks.eventTypes.beforeEnd,
        target: this.hooks.eventTypes.beforeEnd,
      },
    ])

    actions.hooks.on(
      actions.hooks.eventTypes.end,
      (e: TouchEvent, pos: Point) => {
        this.hooks.trigger(this.hooks.eventTypes.touchEnd, pos)

        if (this.hooks.trigger(this.hooks.eventTypes.end, pos)) {
          return true
        }

        // check if it is a click operation
        if (!actions.fingerMoved) {
          this.hooks.trigger(this.hooks.eventTypes.scrollCancel)
          if (this.checkClick(e)) {
            return true
          }
        }
        // reset if we are outside of the boundaries
        if (this.resetPosition(this.options.bounceTime, ease.bounce)) {
          this.animater.setForceStopped(false)
          return true
        }
      }
    )
  }

  private checkClick(e: TouchEvent) {
    const cancelable = {
      preventClick: this.animater.forceStopped,
    }
    // we scrolled less than momentumLimitDistance pixels
    if (this.hooks.trigger(this.hooks.eventTypes.checkClick)) {
      this.animater.setForceStopped(false)
      return true
    }
    if (!cancelable.preventClick) {
      const _dblclick = this.options.dblclick
      let dblclickTrigged = false
      if (_dblclick && this.lastClickTime) {
        const { delay = 300 } = _dblclick as any
        if (getNow() - this.lastClickTime < delay) {
          dblclickTrigged = true
          dblclick(e)
        }
      }
      if (this.options.tap) {
        tap(e, this.options.tap)
      }
      if (
        this.options.click &&
        !preventDefaultExceptionFn(
          e.target,
          this.options.preventDefaultException
        )
      ) {
        click(e)
      }
      this.lastClickTime = dblclickTrigged ? null : getNow()
      return true
    }
    return false
  }


  resizeTimeout: number = 0
  private resize() {
    if (!this.actions.enabled) {
      return
    }
    if (isAndroid) {
      this.wrapper.scrollTop = 0
    }
    clearTimeout(this.resizeTimeout)
    this.resizeTimeout = window.setTimeout(() => {
      this.hooks.trigger(this.hooks.eventTypes.resize)
    }, this.options.resizePolling)
  }
}