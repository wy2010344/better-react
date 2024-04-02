import { EaseFn, Point, easeFns, emptyFun, quote, cubicBezier } from "wy-helper";
import { funCanvas } from "./animationLine";
import { dom } from "better-react-dom";
import { useChange, useEffect, useMemo, useVersion } from "better-react-helper";
import { renderInput } from "better-react-dom-helper";
import { easeCssEase, expandCubicBezierCssToRow } from "wy-dom-helper";
export default function () {

  changeParam(`easeFns.poly`, easeFns.poly, 30, 0.1)


  makeEase(`easeFns.sine`, easeFns.sine)
  makeEase(`easeFns.expo`, easeFns.expo)
  makeEase(`easeFns.circ`, easeFns.circ)
  makeEase(`easeFns.bounce`, bounce)


  changeParam(`easeFns.elastic`, easeFns.elastic, 30, 0.0001)

  changeParam(`easeFns.back`, easeFns.back, 3, 0.0001)

  bezierDraw(easeCssEase)
}



function bezierDraw(css: string) {
  const value = useMemo(() => {
    const [p1, p2] = expandCubicBezierCssToRow(css)
    return cubicBezier(p1.x, p1.y, p2.x, p2.y)
  }, css)

  makeEase(css, value)
}



function changeParam(name: string, getFn: (n: number) => EaseFn, max: number, step: number) {
  const [backS, setBackS] = useChange(0)
  const bfn = useMemo(() => getFn(backS), backS)
  makeEase(`${name}${backS}`, bfn, function () {
    renderInput("input", {
      type: "range",
      value: backS + "",
      max,
      step,
      onValueChange(v) {
        setBackS(Number(v))
      },
    })
  })
}

const bounce = easeFns.out(easeFns.bounceOut)
function makeEase(name: string, fun: EaseFn, render = emptyFun) {
  const [v, updateV] = useVersion(0)
  let ease = 'ease-in'
  let fn = quote as any
  const t = v % 3
  if (t == 1) {
    ease = 'ease-out'
    fn = easeFns.out
  } else if (t == 2) {
    ease = 'ease-in-out'
    fn = easeFns.inOut
  }
  const afn = useMemo(() => fn(fun), [fn, fun])
  funCanvas(function () {
    dom.span().renderText`${name}`
    dom.button({
      onClick: updateV
    }).renderText`${ease}`
    render()
  }, afn)
}