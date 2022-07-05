import { StyleNode } from 'better-react-dom'
import { compile, serialize, stringify, middleware, prefixer } from 'stylis'

let uid = 0
function newClassName() {
  return 'stylis-' + uid++
}
function toCssFragment(className: string, css: string) {
  return serialize(compile(`.${className}{${css}}`), middleware([prefixer, stringify]))
}
export function StylisCreater(): StyleNode {
  const className = newClassName()
  const styled = document.createElement("style")
  styled.id = className
  const body = document.body
  body.appendChild(styled)
  return {
    className,
    update(css) {
      styled.textContent = toCssFragment(className, css)
    },
    destroy() {
      body.removeChild(styled)
    }
  }
}

/**@todo 同时创建多个在一个styled里面,真有必要吗? */
export function cssMap<T extends {
  [key: string]: string
}>(map: T): {
    [key in keyof T]: string
  } {
  const classMap: any = {}
  const contents = Object.entries(map).map(function ([key, value]) {
    const className = newClassName()
    classMap[key] = className
    return toCssFragment(className, value)
  })
  const styled = document.createElement("style")
  const body = document.body
  body.appendChild(styled)
  styled.textContent = contents.join('\n')
  return classMap
}
/**
 * 
 * @param ts 
 * @param vs 
 * @returns 
 */
export function css(ts: TemplateStringsArray, ...vs: (string | number)[]) {
  const xs: any[] = []
  for (let i = 0; i < vs.length; i++) {
    xs.push(ts[i])
    xs.push(vs[i])
  }
  xs.push(ts[vs.length])
  const css = xs.join('')
  const body = StylisCreater()
  body.update(css)
  return body.className
}

import { useMemo, useEffect } from 'better-react'
export function useCss(fun: () => string, deps: any[]) {
  const css = useMemo(() => StylisCreater(), [])
  useEffect(() => {
    return () => css.destroy()
  }, [])
  useEffect(() => {
    css.update(fun())
  }, deps)
  return css.className
}