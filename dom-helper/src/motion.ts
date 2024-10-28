import { genTemplateString, updateDomProps, updateSVGProps, useMerge, VType } from "better-react-dom";
import { addEffectDestroy, useHookEffect, useMemo, useValueCenter } from "better-react-helper";
import { CSSProperties, isSVG } from "wy-dom-helper";
import { emptyArray, ReadValueCenter, syncMergeCenter, valueCenterOf } from "wy-helper";


export function useValueStyle(
  div: ElementCSSInlineStyle,
  style: {
    [key in keyof CSSProperties]: ReadValueCenter<CSSProperties[key]>
  }
) {
  useHookEffect(() => {
    for (const key in style) {
      const nKey = key as 'background'
      const value = style[nKey] as ReadValueCenter<string>
      if (key.startsWith("--")) {
        addEffectDestroy(syncMergeCenter(value, function (value) {
          if (typeof value == 'undefined') {
            div.style.removeProperty(key)
          } else {
            div.style.setProperty(key, value)
          }
        }))
      } else {
        addEffectDestroy(syncMergeCenter(value, function (value) {
          div.style[nKey] = value
        }))
      }
    }
  }, emptyArray)
}


export function useValueAttrs(
  div: HTMLElement,
  attrs: Record<string, ReadValueCenter<string>>
) {
  useHookEffect(() => {
    if (isSVG(div.tagName.toLowerCase())) {
      for (const key in attrs) {
        const value = attrs[key] as ReadValueCenter<string>
        addEffectDestroy(syncMergeCenter(value, function (value) {
          updateSVGProps(div, key, value)
        }))
      }
    } else {
      for (const key in attrs) {
        const value = attrs[key] as ReadValueCenter<string>
        addEffectDestroy(syncMergeCenter(value, function (value) {
          updateDomProps(div, key, value)
        }))
      }
    }
  }, emptyArray)
}


function createCenterSet() {
  const c = valueCenterOf('')
  c.set = c.set.bind(c)
  return c
}
export function useValueTemplate(ts: TemplateStringsArray, ...vs: VType[]): ReadValueCenter<string> {
  const value = useMemo(createCenterSet, emptyArray)
  useMerge(value.set, ts, vs)
  return value
}