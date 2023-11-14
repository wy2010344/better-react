import { compile, serialize, stringify, middleware, prefixer } from 'stylis'
import { useBaseMemoGet, emptyArray, storeRef } from 'better-react'
import { useAttrEffect, useEffect } from 'better-react-helper'
let uid = 0
function newClassName() {
  return 'stylis-' + uid++
}
function toCssFragment(className: string, css: string) {
  return serialize(compile(`.${className}{${css}}`), middleware([prefixer, stringify]))
}

export function createBodyStyleTag() {
  const style = document.createElement("style")
  const body = document.body
  const className = newClassName()
  style.id = className
  body.appendChild(style)
  return style
}


function genCircleMap<T extends CssNest>(
  map: T,
  prefix = '',
  split = '',
  contents: string[]
): T {
  if (typeof map == 'string') {
    //不管split
    contents.push(toCssFragment(prefix, map))
    return prefix as any
  } else if (Array.isArray(map)) {
    return map.map(function (value, i) {
      return genCircleMap(value, `${prefix}${split}${i}`, split, contents)
    }) as any
  } else {
    const classMap: any = {}
    Object.entries(map).forEach(function ([key, value]) {
      const out = genCircleMap(value, `${prefix}${split}${key}`, split, contents)
      classMap[key] = out
    })
    return classMap
  }
}

export function genCssMap<T extends CssNest>(
  map: T,
  prefix = '',
  split = ''
): {
  css: string
  classMap: T
} {
  const contents: string[] = []
  const classMap = genCircleMap(map, prefix, split, contents)
  return {
    css: contents.join('\n'),
    classMap,
  }
}

type CSSParamType = string | number | null | undefined | boolean
export function genCSS(ts: TemplateStringsArray, vs: CSSParamType[]) {
  const xs: any[] = []
  for (let i = 0; i < vs.length; i++) {
    xs.push(ts[i])
    const v = vs[i]
    xs.push(typeof v == 'number' ? v : v || '')
  }
  xs.push(ts[vs.length])
  return xs.join('')
}

function useDeleteStyle(style: HTMLStyleElement) {
  useEffect(() => {
    return function () {
      style.remove()
    }
  }, emptyArray)
}

interface RecordCssNest {
  [key: string]: string | RecordCssNest | ArrayCssNest
}
type ArrayCssNest = (string | RecordCssNest)[]
type CssNest = string | RecordCssNest | ArrayCssNest

export function useCssMap<T extends CssNest>(map: T, split?: string) {
  const style = useBaseMemoGet(createBodyStyleTag, emptyArray)()
  const { css, classMap } = genCssMap(map, style.id, split)
  useAttrEffect(() => {
    style.textContent = css
  }, [css])
  useDeleteStyle(style)
  return classMap
}
/**
 * 单个css,动态变化
 * @param ts 
 * @param vs 
 * @returns 
 */
export function useCss(ts: TemplateStringsArray, ...vs: CSSParamType[]) {
  const css = genCSS(ts, vs)
  return useCssMap(css)
}
/**
 * 这里是全局的,所以应该在回调里使用
 * @param map 
 * @returns 
 */
export function cssMap<T extends CssNest>(map: T, split?: string) {
  const styled = createBodyStyleTag()
  const { css, classMap } = genCssMap(map, styled.id, split)
  styled.textContent = css
  return classMap
}
/**
 * 单个可以直接用StylisCreater
 * 这里要延迟到下一次触发
 * @param ts 
 * @param vs 
 * @returns 
 */
export function css(ts: TemplateStringsArray, ...vs: CSSParamType[]) {
  const style = createBodyStyleTag()
  style.textContent = toCssFragment(style.id, genCSS(ts, vs))
  return style.id
}