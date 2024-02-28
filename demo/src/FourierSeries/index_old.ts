import { domOf } from "better-react-dom";
import { panelWith } from "../panel/PanelContext";
import ComplexNumber from "./ComplexNumber";
import { bitLength } from "./util";
import { useEffect, useState } from "better-react-helper";
import { emptyArray } from "wy-helper";

export default panelWith(function () {
  return {
    width: useState(800),
    children(p, body) {
      const canvas = domOf("canvas", {
        width: 600,
        height: 400,
      }).render()

      useEffect(() => {
        fft([2, 3, 4, 2, 4, 5, 4, 6, 65, 7, 67, 77, 6, 88, 8, 2])
        const ctx = canvas.getContext("2d")

        if (ctx) {
          let rt = 0
          const waves: number[] = []
          const draw = (time: number) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.fillStyle = 'black'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            const radius = 100
            ctx.strokeStyle = 'white'
            ctx.lineWidth = 2
            // ctx.arc(100, 100, radius * 2, 0, Math.PI * 2)



            let x = 0, y = 0

            for (let i = 0; i < 5; i++) {
              const prevX = x, prevY = y

              const n = i * 2 + 1

              const radius = 50 * (4 / (n * Math.PI));
              x += radius * Math.cos(n * rt);
              y += radius * Math.sin(n * rt);



              ctx.beginPath()
              ctx.ellipse(prevX + 200, prevY + 200, radius, radius, 0, 0, Math.PI * 2)
              ctx.stroke()
              ctx.closePath()
              // //半径连线
              ctx.beginPath()
              ctx.moveTo(prevX + 200, prevY + 200)
              ctx.lineTo(x + 200, y + 200)
              ctx.stroke()
              //圆点
              // ctx.beginPath()
              // ctx.fillStyle = 'white'
              // ctx.ellipse(x + 200, y + 200, 4, 4, 0, 0, 2 * Math.PI)
              // ctx.closePath()
              // ctx.fill()
            }


            // ctx.beginPath()
            // ctx.ellipse(200, 200, radius, radius, 0, 0, 2 * Math.PI);
            // ctx.stroke()
            // ctx.closePath()



            waves.unshift(y)
            if (waves.length > 2000) {
              waves.pop()
            }
            //波型
            for (let i = 0; i < waves.length; i++) {
              ctx.lineTo(330 + i, 200 + waves[i])
            }
            ctx.stroke()

            rt -= 0.02
            requestAnimationFrame(draw)
          }
          requestAnimationFrame(draw)
        }
      }, emptyArray)
    },
  }
})


type Imx = {
  re: number
  im: number
}
function dft(x: number[]) {
  const N = x.length
  const X: Imx[] = []
  for (let k = 0; k < N; k++) {
    const ri: Imx = {
      re: 0,
      im: 0
    }
    X[k] = ri

    for (let n = 0; n < N; k++) {
      const phi = (2 * Math.PI * k * n) / N
      ri.re += x[n] * Math.cos(phi)
      ri.im -= x[n] * Math.sin(phi)
    }
    ri.re /= N
    ri.im /= N
  }
  return X
}

function dftN(inputAmplitudes: number[]) {
  const N = inputAmplitudes.length
  const signals: ComplexNumber[] = []
  for (let frequency = 0; frequency < N; frequency++) {
    let singal = new ComplexNumber()
    for (let timer = 0; timer < N; timer++) {
      const currentAmplitude = inputAmplitudes[timer]
      const rotationAngle = -2 * Math.PI * frequency * timer / N
      //根据欧拉公式e^ix=cos(x)+i*sin(x)
      const dataPointContribute = new ComplexNumber(
        currentAmplitude * Math.cos(rotationAngle),
        currentAmplitude * Math.sin(rotationAngle)
      )
      singal = singal.add(dataPointContribute)
    }
    signals.push(singal)
  }
  return signals
}

function fft(inputData: number[]) {
  const bitsCount = bitLength(inputData.length - 1)
  const N = 1 << bitsCount //将inputData扩展成2的幂次宽度

  while (inputData.length < N) {
    inputData.push(0)
  }

  const output: number[] = []
  for (let dataSampleIndex = 0; dataSampleIndex < N; dataSampleIndex += 1) {
    output[dataSampleIndex] = inputData[reverseBits(dataSampleIndex, bitsCount)]
  }
  for (let blockLength = 2; blockLength <= N; blockLength *= 2) {

  }
  console.log('ccc', output)
}


function reverseBits(input: number, bitsCount: number) {
  let reversedBits = 0
  for (let bitIndex = 0; bitIndex < bitsCount; bitIndex++) {
    reversedBits *= 2
    if (Math.floor(input / (1 << bitIndex)) % 2 == 1) {
      reversedBits += 1
    }
  }
  return reversedBits
}