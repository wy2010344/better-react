import { dom } from "better-react-dom";
import { renderArray, renderMap, renderObject } from "better-react-helper";
import { easeCssFn, expandCubicBezierCssToRow } from "wy-dom-helper";
import { objectMap } from "wy-helper";
import { bezierCanvas } from "./animationLine";



const cssArray = objectMap(easeCssFn, function (value, key) {
  return {
    title: key,
    subs: [
      {
        title: "in",
        value: expandCubicBezierCssToRow(value.in)
      }, {
        title: "out",
        value: expandCubicBezierCssToRow(value.out)
      }, {
        title: "inOut",
        value: expandCubicBezierCssToRow(value.inOut)
      }
    ]
  }
})

const ease = expandCubicBezierCssToRow(`cubic-bezier(.42,0,1,1)`)

// const back = expandCssToRow(`cubic-bezier(0.175, 0.885, 0.32, 1.275)`)
// const circular = expandCssToRow(`cubic-bezier(0.075, 0.82, 0.165, 1)`)
// const quad = expandCssToRow(`cubic-bezier(0.25, 0.46, 0.45, 0.94)`)
export default function () {

  dom.p().renderText`
  ease表示慢,ease-in就是开始慢,ease-out就是结束慢,ease-in-out就是开始慢、结束也慢
  `
  renderObject(cssArray, function (value, key) {
    dom.div({
      style: `
      display:flex;
      `
    }).render(function () {
      value.subs.forEach(sub => {
        bezierCanvas(function () {
          dom.span().renderText`${key}-${sub.title}`
        }, sub.value)
      })
    })
  })
}