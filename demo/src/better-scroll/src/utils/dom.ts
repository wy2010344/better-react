import { Rect } from "wy-helper"
import { inBrowser, supportsPassive } from "./env"

export type safeCSSStyleDeclaration = {
  [key: string]: string
} & CSSStyleDeclaration

export function getElement(el: HTMLElement | string) {
  return (
    typeof el === 'string' ? document.querySelector(el) : el
  ) as HTMLElement
}


export function getRect(el: HTMLElement): Rect {
  /* istanbul ignore if  */
  if (el instanceof (window as any).SVGElement) {
    let rect = el.getBoundingClientRect()
    return {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    }
  } else {
    return {
      top: el.offsetTop,
      left: el.offsetLeft,
      width: el.offsetWidth,
      height: el.offsetHeight,
    }
  }
}

let elementStyle = (inBrowser &&
  document.createElement('div').style) as safeCSSStyleDeclaration

let vendor = (() => {
  /* istanbul ignore if  */
  if (!inBrowser) {
    return false
  }
  const transformNames = [
    {
      key: 'standard',
      value: 'transform',
    },
    {
      key: 'webkit',
      value: 'webkitTransform',
    },
    {
      key: 'Moz',
      value: 'MozTransform',
    },
    {
      key: 'O',
      value: 'OTransform',
    },
    {
      key: 'ms',
      value: 'msTransform',
    },
  ]
  for (let obj of transformNames) {
    if (elementStyle[obj.value] !== undefined) {
      return obj.key
    }
  }
  /* istanbul ignore next  */
  return false
})()

/* istanbul ignore next  */
function prefixStyle(style: string): string {
  if (vendor === false) {
    return style
  }

  if (vendor === 'standard') {
    if (style === 'transitionEnd') {
      return 'transitionend'
    }
    return style
  }

  return vendor + style.charAt(0).toUpperCase() + style.substr(1)
}

let transform = prefixStyle('transform')
let transition = prefixStyle('transition')
export const style = {
  transform,
  transition,
  transitionTimingFunction: prefixStyle('transitionTimingFunction'),
  transitionDuration: prefixStyle('transitionDuration'),
  transitionDelay: prefixStyle('transitionDelay'),
  transformOrigin: prefixStyle('transformOrigin'),
  transitionEnd: prefixStyle('transitionEnd'),
  transitionProperty: prefixStyle('transitionProperty'),
}



export function addEvent(
  el: HTMLElement,
  type: string,
  fn: EventListenerOrEventListenerObject,
  capture?: AddEventListenerOptions
) {
  const useCapture = supportsPassive
    ? {
      passive: false,
      capture: !!capture,
    }
    : !!capture
  el.addEventListener(type, fn, useCapture)
}


export function removeEvent(
  el: HTMLElement,
  type: string,
  fn: EventListenerOrEventListenerObject,
  capture?: EventListenerOptions
) {
  el.removeEventListener(type, fn, {
    capture: !!capture,
  })
}




export const eventTypeMap: {
  [key: string]: number
  touchstart: number
  touchmove: number
  touchend: number
  touchcancel: number
  mousedown: number
  mousemove: number
  mouseup: number
} = {
  touchstart: 1,
  touchmove: 1,
  touchend: 1,
  touchcancel: 1,

  mousedown: 2,
  mousemove: 2,
  mouseup: 2,
}


export function preventDefaultExceptionFn(
  el: any,
  exceptions: {
    tagName?: RegExp
    className?: RegExp
    [key: string]: any
  }
) {
  for (let i in exceptions) {
    if (exceptions[i].test(el[i])) {
      return true
    }
  }
  return false
}

export const tagExceptionFn = preventDefaultExceptionFn


export function maybePrevent(e: Event) {
  if (e.cancelable) {
    e.preventDefault()
  }
}