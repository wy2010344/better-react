import { StyleNode } from 'better-react-dom'
import { compile, serialize, stringify, middleware, prefixer } from 'stylis'

let uid = 0
export function StylisCreater(): StyleNode {
  const className = 'stylis-' + uid++
  const styled = document.createElement("style")
  styled.id = className
  document.body.appendChild(styled)
  return {
    className,
    update(css) {
      styled.textContent = serialize(compile(`.${className}{${css}}`), middleware([prefixer, stringify]))
    },
    destroy() {
      document.body.removeChild(styled)
    }
  }
}


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

import { useRefValue, useEffect } from 'better-react'
export function useCss(fun: () => string, deps: any[]) {
  const css = useRefValue(() => StylisCreater())()
  useEffect(() => {
    return () => css.destroy()
  }, [])
  useEffect(() => {
    css.update(fun())
  }, deps)
  return css.className
}