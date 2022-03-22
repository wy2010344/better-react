import { useEffect, useRefValue } from "better-react"






let uid = 0
export function nestCss() {
  const id = "nestStyle" + (uid++)
  const styled = document.createElement("style")
  styled.id = id
  document.body.appendChild(styled)
  return {
    className: id,
    update(css: string) {
      const first = {
        key: `.${id}`,
        content: []
      }
      const pvs: {
        key: string
        content: string[]
      }[] = [first]
      const pv: {
        key: string
        content: string[]
      }[] = [first]
      css.split('\n').forEach(v => {
        const idx = v.indexOf('{')
        if (idx > -1) {
          const node = {
            key: pv.map(x => x.key).join("") + v.slice(0, idx).trim(),
            content: []
          }
          pv.push(node)
          pvs.push(node)
        } else if (v.indexOf('}') > -1) {
          pv.pop()
        } else {
          pv[pv.length - 1].content.push(v)
        }
      })
      styled.innerHTML = pvs.map(xv => {
        return `${xv.key}{
          ${xv.content.join('\n')}
        }`
      }).join('\n')
    },
    destroy() {
      document.body.removeChild(styled)
    }
  }
}

/**
 * 常、静态的css
 * @param css 
 * @returns 
 */
export function createStyle(css: string) {
  const cssArea = nestCss()
  cssArea.update(css)
  return cssArea.className
}

/**
 * 依赖更新css
 * @param fun 
 * @param deps 
 * @returns 
 */
export function useCss(fun: () => string, deps: any[]) {
  const css = useRefValue(() => nestCss())()
  useEffect(() => {
    return () => css.destroy()
  }, [])
  useEffect(() => {
    css.update(fun())
  }, deps)
  return css.className
}