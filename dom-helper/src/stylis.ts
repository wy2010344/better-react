import { compile, serialize, stringify, middleware, prefixer } from 'stylis'
import { useBaseMemoGet, useEffect, emptyArray } from 'better-react'
let uid = 0
function newClassName() {
  return 'stylis-' + uid++
}
function toCssFragment(className: string, css: string) {
  return serialize(compile(`.${className}{${css}}`), middleware([prefixer, stringify]))
}

export function createBodyStyleTag() {
  const styled = document.createElement("style")
  const body = document.body
  body.appendChild(styled)
  return styled
}
function createStyled(css: string) {
  const className = newClassName()
  const styled = createBodyStyleTag()
  styled.textContent = toCssFragment(className, css)
  styled.id = className
  return styled
}
export function genCssMap<T extends {
  [key: string]: string
}>(map: T): {
  css: string
  classMap: {
    [key in keyof T]: string
  }
} {
  const classMap: any = {}
  const contents = Object.entries(map).map(function ([key, value]) {
    const className = newClassName()
    classMap[key] = className
    return toCssFragment(className, value)
  })
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

function createEmptyStyle() {
  return createStyled('')
}

/**
 * 单个css,动态变化
 * @param ts 
 * @param vs 
 * @returns 
 */
export function useCss(ts: TemplateStringsArray, ...vs: CSSParamType[]) {
  const css = genCSS(ts, vs)
  const style = useBaseMemoGet(createEmptyStyle, emptyArray)()
  useEffect(() => {
    style.textContent = toCssFragment(style.id, css)
  }, [css])
  useEffect(() => {
    return function () {
      style.remove()
    }
  }, emptyArray)
  return style.id
}

/**
 * 这里是全局的,所以应该在回调里使用
 * @param map 
 * @returns 
 */
export function cssMap<T extends {
  [key: string]: string
}>(map: T) {
  const styled = createBodyStyleTag()
  const { css, classMap } = genCssMap(map)
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
  const body = createStyled(genCSS(ts, vs))
  return body.id
}
