import { StyleNode } from 'better-react-dom'
import { compile, serialize, stringify, middleware, prefixer } from 'stylis'

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
/**
 * 这个是供全局嵌入的css
 * 单个的可以使用
 * 这里在内嵌css中,一定是在最终渲染界面是调用
 * @returns 
 */
export function StylisCreater(): StyleNode {
  const className = newClassName()
  const styled = createBodyStyleTag()
  styled.id = className
  return {
    className,
    update(css) {
      styled.textContent = toCssFragment(className, css)
    },
    destroy() {
      styled.remove()
    }
  }
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

export function genCSS(ts: TemplateStringsArray, ...vs: (string | number)[]) {
  const xs: any[] = []
  for (let i = 0; i < vs.length; i++) {
    xs.push(ts[i])
    xs.push(vs[i])
  }
  xs.push(ts[vs.length])
  return xs.join('')
}
/**
 * 单个可以直接用StylisCreater
 * 这里要延迟到下一次触发
 * @param ts 
 * @param vs 
 * @returns 
 */
export function css(ts: TemplateStringsArray, ...vs: (string | number)[]) {
  const body = StylisCreater()
  body.update(genCSS(ts, ...vs))
  return body.className
}

import { useMemoGet, useEffect, createChangeAtom } from 'better-react'

/**
 * 这里因为在render中,延迟到渲染时执行,可以由事件触发更新css
 * @returns 
 */
export function useBodyStyleUpdate() {
  const { styled, update } = useMemoGet(() => {
    const styled = createBodyStyleTag()
    const atom = createChangeAtom<string>("", function (css) {
      styled.textContent = css
      return css
    })
    return {
      styled,
      update(css: string) {
        atom.set(css)
      }
    }
  }, [])()
  useEffect(() => {
    return function () {
      styled.remove()
    }
  }, [])
  return update
}

/**
 * 使用deps通知更新css
 * @param callback 
 * @param deps 
 * @returns 
 */
export function useStyleMap<A extends any[], T extends {
  [key: string]: string
}>(callback: (...args: A) => T, deps: A) {
  const update = useBodyStyleUpdate()
  return useMemoGet(() => {
    const cssMap = callback(...deps)
    const { css, classMap } = genCssMap(cssMap)
    update(css)
    return classMap
  }, deps)()
}
