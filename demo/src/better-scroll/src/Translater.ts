import { Point } from "wy-helper"
import { safeCSSStyleDeclaration, style } from "./utils/dom"
import { EventEmitter } from "./utils/events"

interface TranslaterMetaData {
  x: [string, string]
  y: [string, string]
}
const translaterMetaData: TranslaterMetaData = {
  x: ['translateX', 'px'],
  y: ['translateY', 'px'],
}

/**
 * 似乎只供一处使用.
 * 将坐标映射到元素的style.transform上面
 */
export default class Translater {
  content: HTMLElement = null!
  style: CSSStyleDeclaration = null!
  hooks: EventEmitter
  constructor(content: HTMLElement) {
    this.setContent(content)
    this.hooks = new EventEmitter(['beforeTranslate', 'translate'])
  }

  getComputedPosition() {
    let cssStyle = window.getComputedStyle(
      this.content,
      null
    ) as safeCSSStyleDeclaration
    let matrix = cssStyle[style.transform].split(')')[0].split(', ')
    const x = +(matrix[12] || matrix[4]) || 0
    const y = +(matrix[13] || matrix[5]) || 0

    return {
      x,
      y,
    }
  }

  translate(point: Point) {
    let transformStyle = [] as string[]
    Object.keys(point).forEach((_key) => {
      const key = _key as 'x'
      const metaData = translaterMetaData[key]
      if (!metaData) {
        return
      }
      const transformFnName = metaData[0]
      if (transformFnName) {
        const transformFnArgUnit = metaData[1]
        const transformFnArg = point[key]
        transformStyle.push(
          `${transformFnName}(${transformFnArg}${transformFnArgUnit})`
        )
      }
    })
    this.hooks.trigger(
      this.hooks.eventTypes.beforeTranslate,
      transformStyle,
      point
    )
    this.style[style.transform as any] = transformStyle.join(' ')
    this.hooks.trigger(this.hooks.eventTypes.translate, point)
  }

  setContent(content: HTMLElement) {
    if (this.content !== content) {
      this.content = content
      this.style = content.style
    }
  }

  destroy() {
    this.hooks.destroy()
  }
}