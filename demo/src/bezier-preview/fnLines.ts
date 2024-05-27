import { EaseFn, easeFns, emptyFun, quote, cubicBezier } from "wy-helper";
import { funCanvas } from "./animationLine";
import { dom } from "better-react-dom";
import { useChange, useMemo, useVersion } from "better-react-helper";
import { renderInput } from "better-react-dom-helper";
import { easeCssEase, expandCubicBezierCssToRow } from "wy-dom-helper";

function getElastic(
  a: number,
  p: number = 0.3) {
  return function elastic(
    t: number) {
    var s: number;
    if (t == 0) return 0;
    if (t == 1) return 1;
    if (!a || a < Math.abs(1)) {
      s = p / 4;
      a = 1;
    } else {
      s = p / (2 * Math.PI) * Math.asin(1 / a);
    }
    return -(a * Math.pow(2, 10 * (t -= 1)) *
      Math.sin((t - s) * (2 * Math.PI) / p));
  }
}
export default function () {

  changeParam(`easeFns.poly`, easeFns.poly, 30, 0.1)


  makeEase(`easeFns.sine`, easeFns.sine)
  makeEase(`easeFns.expo`, easeFns.expo)
  makeEase(`easeFns.circ`, easeFns.circ)
  makeEase(`easeFns.bounce`, bounce)


  changeParam(`easeFns.elastic`, easeFns.elasticOut, 30, 0.0001)

  changeParam(`easeFns.back`, easeFns.back, 3, 0.0001)

  bezierDraw(easeCssEase)


  const [a, setA] = useChange(0)
  const [p, setP] = useChange(0)
  const bfn = useMemo(() => getElastic(a, p), [a, p])
  makeEase(`elastic a:${a}--p:${p}`, bfn, function () {
    renderInput("input", {
      type: "range",
      value: a + "",
      max: 10,
      step: 0.1,
      onValueChange(v) {
        setA(Number(v))
      },
    })

    renderInput("input", {
      type: "range",
      value: p + "",
      max: 10,
      step: 0.1,
      onValueChange(v) {
        setP(Number(v))
      },
    })
  })

  userDefine()
}



function userDefine() {
  const [value, setValue] = useChange('')
  const afn = useMemo(() => {
    try {
      const fn = eval(value)
      if (typeof fn == 'function') {
        const v = fn(0.5)
        if (typeof (v == 'number')) {
          return {
            type: "success",
            value: fn
          } as const
        }
      }
      return {
        type: "error",
        value: "invalid-function"
      } as const
    } catch (err) {
      return {
        type: "error",
        value: err
      } as const
    }
  }, [value])
  /**
   * 比如数学公式凑出来的曲线
   * t=>Math.pow(1-t,3) * Math.cos(Math.PI * 12 * t * t /2)
   * 只能使用数值法来逆向求t,没有通用的公式.即使cos里面的t是单次的.
   * 又如曲线公式与其它公式结合...
   */
  makeEase(`userDefine`, afn.type == 'success' ? afn.value : quote, function () {
    renderInput("textarea", {
      value,
      onValueChange(v) {
        setValue(v)
      },
    })
  })
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