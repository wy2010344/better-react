import { domOf, svgOf } from "better-react-dom";
import { panelWith } from "../panel/PanelContext";
import ComplexNumber from "./ComplexNumber";
import { renderArray, useMemo, useReducer } from "better-react-helper";
import { useEffect } from "better-react";
import { extent, min, scaleBand, scaleLinear, scalePoint } from "d3";
import dft, { dft2 } from "./dft";
import fastFourierTransform, { fft2, fft3, ifft2, ifft3 } from "./fft";

type Model = {
  pointers: ComplexNumber[]
  onDraw: boolean
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
    if (!data.onDraw) {
      return {
        onDraw: true,
        pointers: [
          action.pointer
        ]
      }
    }
  } else if (action.type == 'move') {
    if (data.onDraw) {
      return {
        onDraw: true,
        pointers: [
          ...data.pointers,
          action.pointer
        ]
      }
    }
  } else if (action.type == 'up') {
    if (data.onDraw) {
      return {
        onDraw: false,
        pointers: data.pointers
      }
    }
  }
  return data
}

function initData(): Model {
  return {
    onDraw: false,
    pointers: []
  }
}
export default panelWith({
  initWidth: 800,
  bodyStyle: `overflow-y:auto;`,
  children(operate, id, arg) {
    const [data, dispatch] = useReducer(reducer, 0, initData)

    const ps = data.pointers
    useEffect(() => {
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        const first = ps[0]
        if (first) {
          ctx.strokeStyle = 'white'
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(first.re, first.im)
          for (let i = 1; i < ps.length; i++) {
            const pointer = ps[i]
            ctx.lineTo(pointer.re, pointer.im)
          }
          ctx.stroke()
        }
      }
    }, [ps])
    const canvas = domOf("canvas", {
      width: 200,
      height: 200,
      style: `
      background:#000;
      `,
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
    renderViewComplex(ps)
    domOf("h1").renderTextContent("dft")
    const dftOuts = useMemo(() => {
      return dft(ps)
    }, [data.onDraw])
    renderViewComplex(dftOuts)
    domOf("h1").renderTextContent("dft2")
    const dft2Outs = useMemo(() => {
      return dft2(ps)
    }, [data.onDraw])
    renderViewComplex(dft2Outs)
    domOf("h1").renderTextContent("fft")
    const fftOuts = useMemo(() => {
      return fastFourierTransform(ps)//.sort((a, b) => a.radius() - b.radius())
    }, [data.onDraw])
    renderViewComplex(fftOuts)

    domOf("h1").renderTextContent("fft-re")
    const fftOutsRe = useMemo(() => {
      return fastFourierTransform(fftOuts, true)//.sort((a, b) => a.radius() - b.radius())
    }, [fftOuts])
    renderViewComplex(fftOutsRe)
    domOf("h1").renderTextContent("fft2")
    const newFFtOuts = useMemo(() => {
      return fft2(ps)//.sort((a, b) => a.radius() - b.radius())
    }, [data.onDraw])
    renderViewComplex(newFFtOuts)

    domOf("h1").renderTextContent("fft-re")
    const fft2OutsRe = useMemo(() => {
      return ifft2(newFFtOuts)//.sort((a, b) => a.radius() - b.radius())
    }, [fftOuts])
    renderViewComplex(fft2OutsRe)

    domOf("h1").renderTextContent("fft3")
    const newFFt3Outs = useMemo(() => {
      return fft3(ps)
    }, [data.onDraw])
    renderViewComplex(newFFt3Outs)
    domOf("h1").renderTextContent("fft3-re")
    const newFFt3ReOuts = useMemo(() => {
      return ifft3(newFFt3Outs)
    }, [newFFt3Outs])
    renderViewComplex(newFFt3ReOuts)
  },
})


function renderViewComplex(ps: ComplexNumber[]) {
  domOf("br").render()
  const width = 500, height = 300
  svgOf("svg", {
    width: 500,
    height: 300
  }).render(function () {
    const { xScale, yReScale, yImScale } = useMemo(() => {
      const xScale = scaleBand()
        .domain(ps.map((_, i) => i + ''))
        .range([0, width])
        .paddingInner(0.3)
      const yReScale = scaleLinear().domain(xExtend(ps.map(p => p.re))).range([0, height])
      const yImScale = scaleLinear().domain(xExtend(ps.map(p => p.im))).range([0, height])
      return {
        xScale,
        yReScale,
        yImScale
      }
    }, [ps])

    renderArray(ps, getIndex, function (p, i) {
      svgOf("rect", {
        width: xScale.bandwidth(),
        height: yReScale(p.re),
        x: xScale(i + ''),
        y: height - yReScale(p.re),
        style: `
          fill:#a2fc0061;
          `
      }).render()

      svgOf("circle", {
        r: 5,
        cx: xScale(i + ''),
        cy: height - yImScale(p.im),
        style: `
          fill:#fc520061;
          `
      }).render()
    })
  })
}

function getIndex(vs: any, i: number) {
  return i
}
function xExtend(vs: number[]) {
  return [Math.min.apply(Math, vs), Math.max.apply(Math, vs)]
}