import { eventTypeMap, preventDefaultExceptionFn, tagExceptionFn } from "./utils/dom"
import { EventType, MouseButton } from "./utils/enums"
import { EventEmitter, EventRegister } from "./utils/events"


type Exception = {
  tagName?: RegExp
  className?: RegExp
}

export interface Options {
  [key: string]: boolean | number | Exception
  click: boolean
  bindToWrapper: boolean
  disableMouse: boolean
  disableTouch: boolean
  preventDefault: boolean
  stopPropagation: boolean
  /**
   * 默认值：{ tagName: /^(INPUT|TEXTAREA|BUTTON|SELECT|AUDIO)$/}
作用：BetterScroll 会阻止原生的滚动，这样也同时阻止了一些原生组件的默认行为。这个时候我们不能对这些元素做 preventDefault，所以我们可以配置 preventDefaultException。默认值 {tagName: /^(INPUT|TEXTAREA|BUTTON|SELECT|AUDIO)$/}表示标签名为 input、textarea、button、select、audio 这些元素的默认行为都不会被阻止。
备注：这是一个非常有用的配置，它的 key 是 DOM 元素的属性值，value 可以是一个正则表达式。比如我们想配一个 class 名称为 test 的元素，那么配置规则为 {className:/(^|\s)test(\s|$)/}。
#
   */
  preventDefaultException: Exception
  tagException: Exception
  autoEndDistance: number
}


export default class ActionsHandler {
  hooks: EventEmitter
  initiated!: number
  pointX!: number
  pointY!: number
  wrapperEventRegister!: EventRegister
  targetEventRegister!: EventRegister
  constructor(public wrapper: HTMLElement, public options: Options) {
    this.hooks = new EventEmitter([
      'beforeStart',
      'start',
      'move',
      'end',
      'click',
    ])
    this.handleDOMEvents()
  }
  private handleDOMEvents() {
    const { bindToWrapper, disableMouse, disableTouch, click } = this.options
    const wrapper = this.wrapper
    const target = bindToWrapper ? wrapper : window
    const wrapperEvents = []
    const targetEvents = []
    const shouldRegisterTouch = !disableTouch
    const shouldRegisterMouse = !disableMouse

    if (click) {
      wrapperEvents.push({
        name: 'click',
        handler: this.click.bind(this),
        capture: true,
      })
    }

    if (shouldRegisterTouch) {
      wrapperEvents.push({
        name: 'touchstart',
        handler: this.start.bind(this),
      })

      targetEvents.push(
        {
          name: 'touchmove',
          handler: this.move.bind(this),
        },
        {
          name: 'touchend',
          handler: this.end.bind(this),
        },
        {
          name: 'touchcancel',
          handler: this.end.bind(this),
        }
      )
    }

    if (shouldRegisterMouse) {
      wrapperEvents.push({
        name: 'mousedown',
        handler: this.start.bind(this),
      })

      targetEvents.push(
        {
          name: 'mousemove',
          handler: this.move.bind(this),
        },
        {
          name: 'mouseup',
          handler: this.end.bind(this),
        }
      )
    }
    this.wrapperEventRegister = new EventRegister(wrapper, wrapperEvents)
    this.targetEventRegister = new EventRegister(target, targetEvents)
  }
  private beforeHandler(e: TouchEvent, type: 'start' | 'move' | 'end') {
    const {
      preventDefault,
      stopPropagation,
      preventDefaultException,
    } = this.options

    const preventDefaultConditions = {
      start: () => {
        return (
          preventDefault &&
          !preventDefaultExceptionFn(e.target, preventDefaultException)
        )
      },
      end: () => {
        return (
          preventDefault &&
          !preventDefaultExceptionFn(e.target, preventDefaultException)
        )
      },
      move: () => {
        return preventDefault
      },
    }
    if (preventDefaultConditions[type]()) {
      e.preventDefault()
    }

    if (stopPropagation) {
      e.stopPropagation()
    }
  }
  setInitiated(type: number = 0) {
    this.initiated = type
  }

  private start(e: TouchEvent) {
    const _eventType = eventTypeMap[e.type]

    if (this.initiated && this.initiated !== _eventType) {
      return
    }
    this.setInitiated(_eventType)

    // if textarea or other html tags in options.tagException is manipulated
    // do not make bs scroll
    if (tagExceptionFn(e.target, this.options.tagException)) {
      this.setInitiated()
      return
    }

    // only allow mouse left button
    if (_eventType === EventType.Mouse && (e as any).button !== MouseButton.Left) return

    if (this.hooks.trigger(this.hooks.eventTypes.beforeStart, e)) {
      return
    }

    this.beforeHandler(e, 'start')

    let point = (e.touches ? e.touches[0] : e) as Touch
    this.pointX = point.pageX
    this.pointY = point.pageY

    this.hooks.trigger(this.hooks.eventTypes.start, e)
  }

  private move(e: TouchEvent) {
    if (eventTypeMap[e.type] !== this.initiated) {
      return
    }

    this.beforeHandler(e, 'move')

    let point = (e.touches ? e.touches[0] : e) as Touch
    let deltaX = point.pageX - this.pointX
    let deltaY = point.pageY - this.pointY
    this.pointX = point.pageX
    this.pointY = point.pageY

    if (
      this.hooks.trigger(this.hooks.eventTypes.move, {
        deltaX,
        deltaY,
        e,
      })
    ) {
      return
    }

    // auto end when out of viewport
    let scrollLeft =
      document.documentElement.scrollLeft ||
      window.pageXOffset ||
      document.body.scrollLeft
    let scrollTop =
      document.documentElement.scrollTop ||
      window.pageYOffset ||
      document.body.scrollTop

    let pX = this.pointX - scrollLeft
    let pY = this.pointY - scrollTop

    const autoEndDistance = this.options.autoEndDistance
    if (
      pX > document.documentElement.clientWidth - autoEndDistance ||
      pY > document.documentElement.clientHeight - autoEndDistance ||
      pX < autoEndDistance ||
      pY < autoEndDistance
    ) {
      this.end(e)
    }
  }

  private end(e: TouchEvent) {
    if (eventTypeMap[e.type] !== this.initiated) {
      return
    }
    this.setInitiated()

    this.beforeHandler(e, 'end')

    this.hooks.trigger(this.hooks.eventTypes.end, e)
  }


  private click(e: TouchEvent) {
    this.hooks.trigger(this.hooks.eventTypes.click, e)
  }


  setContent(content: HTMLElement) {
    if (content !== this.wrapper) {
      this.wrapper = content
      this.rebindDOMEvents()
    }
  }

  rebindDOMEvents() {
    this.wrapperEventRegister.destroy()
    this.targetEventRegister.destroy()
    this.handleDOMEvents()
  }

  destroy() {
    this.wrapperEventRegister.destroy()
    this.targetEventRegister.destroy()
    this.hooks.destroy()
  }

}