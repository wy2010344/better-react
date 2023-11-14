import { panelWith } from "@/panel/PanelContext";
import { createUseReducer, useEffect, useState } from "better-react-helper";
import { ThemeColors, defineColors } from "../../../kanren-logic/src";
import renderPanel from "@/panel/renderPanel";
import { emptyArray } from "better-react";
import { renderInput } from "better-react-dom-helper";
import { dom } from "better-react-dom";


const colorThemeKey = "kanren-code-color-theme"

const useChangeColor = createUseReducer(function (model: {
  primaryColor: string
  colorTheme: ThemeColors
}, action: {
  method: "change-color"
  key: keyof ThemeColors
  value: string
} | {
  method: "change-background"
  key: keyof ThemeColors
  value: string
} | {
  method: "change-primary",
  value: string
}) {

  if (action.method == 'change-color') {
    return {
      ...model,
      colorTheme: {
        ...model.colorTheme,
        [action.key]: {
          ...model.colorTheme[action.key],
          color: action.value
        }
      }
    }
  } else if (action.method == 'change-background') {
    return {
      ...model,
      colorTheme: {
        ...model.colorTheme,
        [action.key]: {
          ...model.colorTheme[action.key],
          background: action.value
        }
      }
    }
  } else if (action.method == 'change-primary') {
    return {
      ...model,
      primaryColor: action.value
    }
  }
  return model
}, (n: number) => {
  try {
    return JSON.parse(localStorage.getItem(colorThemeKey) || '')
  } catch (err) {
    return {
      primaryColor: "#ffffff",
      colorTheme: defineColors
    }
  }
})
export default function renderColorConfig() {


  const [colorTheme, dispatch] = useChangeColor(0)


  useEffect(() => {
    localStorage.setItem(colorThemeKey, JSON.stringify(colorTheme))
  }, [colorTheme])

  useEffect(() => {
    document.body.appendChild(div)
  }, emptyArray)
  const div = renderPanel({
    initTop: 377,
    initLeft: 148,
    close() {

    },
    moveFirst() {

    },
    children(p, body) {
      dom.div().text`主题色`
      renderInput("input", {
        type: "color",
        value: colorTheme.primaryColor || "#ffffff",
        onValueChange(v) {
          dispatch({
            method: "change-primary",
            value: v
          })
        },
      })
      dom.table().render(function () {
        dom.tr().render(function () {
          dom.td().text`名字`
          dom.td().text`背景`
          dom.td().text`前景`
        })
        Object.keys(defineColors).forEach(function (_key) {
          const key = _key as keyof ThemeColors
          dom.tr().render(function () {

            dom.td().render(function () {
              dom.span().text`${key}`
            })

            dom.td().render(function () {
              renderInput("input", {
                type: "color",
                className: key,
                value: colorTheme.colorTheme[key]?.background || "#ffffff",
                onValueChange(v) {
                  dispatch({
                    method: "change-background",
                    key,
                    value: v
                  })
                },
              })
            })

            dom.td().render(function () {
              renderInput("input", {
                type: "color",
                className: key,
                value: colorTheme.colorTheme[key]?.color || "#000000",
                onValueChange(v) {
                  dispatch({
                    method: "change-color",
                    key,
                    value: v
                  })
                },
              })
            })
          })
        })
      })
    },
    asPortal: true
  })

  return colorTheme
}