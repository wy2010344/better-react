import { domOf } from "better-react-dom";
import { panelWith } from "../panel/PanelContext";
import { useReducer } from "better-react-helper";
import ComplexNumber, { radianToDegree } from "./ComplexNumber";
import { useEffect } from "better-react-helper"
import fastFourierTransform from "./fft";
import dft from "./dft";
import { stringifyStyle } from "better-react-dom-helper";

/**
 * 参考源
 * https://editor.p5js.org/codingtrain/sketches/sPvZsg2w4
 */
type Model = {
  pointers: ComplexNumber[]
  userDraw: boolean
}
function reducer(data: Model, action: {
  type: "down",
  pointer: ComplexNumber
} | {
  type: "move"
  pointer: ComplexNumber
} | {
  type: "up"
}): Model {
  if (action.type == 'down') {
    if (data.userDraw) {
      return data
    }
    return {
      pointers: [
        action.pointer
      ],
      userDraw: true
    }
  } else if (action.type == 'move') {
    if (!data.userDraw) {
      return data
    }
    return {
      ...data,
      pointers: [
        ...data.pointers,
        action.pointer
      ]
    }
  } else if (action.type == 'up') {
    if (!data.userDraw) {
      return data
    }
    return {
      ...data,
      userDraw: false
    }
  }
  return data
}
function initData() {
  return {
    pointers: [],
    userDraw: false
  }
}
export default panelWith({
  initWidth: 800,
  children(operate, id, arg) {
    const [data, dispatch] = useReducer(reducer, 0, initData)
    useEffect(() => {
      let destroyed = false
      const ctx = canvas.getContext("2d")
      if (ctx) {
        if (data.userDraw) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          ctx.beginPath()
          const first = data.pointers[0]
          if (first) {
            ctx.strokeStyle = 'white'
            ctx.lineWidth = 1
            ctx.moveTo(first.re, first.im)
            for (let i = 1; i < data.pointers.length; i++) {
              const pointer = data.pointers[i]
              ctx.lineTo(pointer.re, pointer.im)
            }
            ctx.stroke()
          }
        } else {
          // ctx.clearRect(0, 0, canvas.width, canvas.height)
          //为什么用fft不行?
          // const outs = fft2(data.pointers).map<FOut>((cp, i) => {
          //   return {
          //     radius: cp.radius(),
          //     parse: Math.atan2(cp.im, cp.re),// cp.parse(),
          //     freq: i,
          //     value: cp
          //   }
          // }).sort((a, b) => b.radius - a.radius)
          // console.log(outs)
          /**
           * 为什么dft可以,fft不行
           */
          const outs = dft2(data.pointers).sort((a, b) => b.radius - a.radius)
          let time = 0
          const epicycles = (
            x: number,
            y: number,
            rotation: number,
            fourier: FOut[]
          ) => {
            for (let i = 0; i < fourier.length; i++) {
              const fr = fourier[i]
              let prevX = x, prevY = y
              x += fr.radius * Math.cos(fr.freq * time + fr.parse + rotation)
              y += fr.radius * Math.sin(fr.freq * time + fr.parse + rotation)
              ctx.beginPath()
              ctx.ellipse(prevX, prevY, fr.radius, fr.radius, 0, 0, Math.PI * 2)
              ctx.stroke()
              ctx.beginPath()
              ctx.moveTo(prevX, prevY)
              ctx.lineTo(x, y)
              ctx.stroke()
            }
            return new ComplexNumber(x, y)
          }
          const paths: ComplexNumber[] = []
          const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            const v = epicycles(0, 0, 0, outs)
            paths.unshift(v)
            time += Math.PI * 2 / outs.length;

            ctx.beginPath()
            ctx.moveTo(paths[0].re, paths[0].im)
            for (let i = 1; i < paths.length; i++) {
              ctx.lineTo(paths[i].re, paths[i].im)
            }
            ctx.stroke()
            if (time > Math.PI * 2) {
              time = 0
              // console.log(paths)
              paths.length = 0
              // destroyed = true
            }
            if (!destroyed) {
              requestAnimationFrame(animate)
            }
          }
          requestAnimationFrame(animate)
        }
      }
      return function () {
        destroyed = true
      }
    }, [data])
    const canvas = domOf("canvas", {
      width: 600,
      height: 500,
      style: stringifyStyle({
        background: "black"
      }),
      onPointerDown(event) {
        const rect = canvas.getBoundingClientRect()
        dispatch({
          type: "down",
          pointer: new ComplexNumber(event.clientX - rect.x, event.clientY - rect.y)
        })
      },
      onPointerMove(event) {
        const rect = canvas.getBoundingClientRect()
        dispatch({
          type: "move",
          pointer: new ComplexNumber(event.clientX - rect.x, event.clientY - rect.y)
        })
      },
      onPointerUp(event) {
        dispatch({
          type: "up"
        })
      },
    }).render()
  },
})



type FOut = {
  /**
   * 频率
   */
  freq: number
  /**
   * 模、幅值
   */
  radius: number
  /**
   * 弧度角
   */
  parse: number

  value: ComplexNumber
}


function dft2(x: ComplexNumber[]) {
  const X: FOut[] = [];
  const N = x.length;
  for (let k = 0; k < N; k++) {
    let sum = new ComplexNumber(0, 0);
    for (let n = 0; n < N; n++) {
      const phi = (Math.PI * 2 * k * n) / N;
      const c = new ComplexNumber(Math.cos(phi), -Math.sin(phi));
      sum = sum.add(x[n].mul(c));
    }
    sum = new ComplexNumber(sum.re / N, sum.im / N)
    let freq = k;
    let radius = Math.sqrt(sum.re * sum.re + sum.im * sum.im);
    let parse = Math.atan2(sum.im, sum.re);
    X[k] = { freq, radius, parse, value: sum };
  }
  return X;
}
