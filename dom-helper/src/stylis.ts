import { emptyArray, emptyObject, objectDiffDeleteKey } from "wy-helper"
import { useAtom, useAttrEffect, useEffect, useMemoGet } from "better-react-helper"
import { CSSParamType, CSSProperties, CssNest, createBodyStyleTag, genCSS, genCssMap } from "wy-dom-helper"

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
function useDeleteStyle(style: HTMLStyleElement) {
  useEffect(() => {
    return function () {
      style.remove()
    }
  }, emptyArray)
}
export function useCssMap<T extends CssNest>(map: T, split?: string) {
  const style = useMemoGet(createBodyStyleTag, emptyArray)()
  const { css, classMap } = genCssMap(map, style.id, split)
  useAttrEffect(() => {
    style.textContent = css
  }, [css])
  useDeleteStyle(style)
  return classMap
}




export function useStyle(div: HTMLElement, style: CSSProperties = emptyObject) {
  const old = useAtom<CSSProperties>(emptyObject)
  useAttrEffect(() => {
    objectDiffDeleteKey(old.get() as any, style as any, function (key: any) {
      div.style[key] = ''
    })
    for (const key in style) {
      const value = style[key as keyof CSSProperties]
      const oldValue = old.get()[key as keyof CSSProperties]
      if (value != oldValue) {
        div.style[key as any] = value as any
      }
    }
    old.set(style)
  })
}