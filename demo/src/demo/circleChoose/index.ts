import { dom, svg } from "better-react-dom";
import { renderPage } from "../util/page";
import { createUseReducer, renderMax, useAtom, useChange, useEffect, useState } from "better-react-helper";
import { emptyArray, quote } from "wy-helper";
import { dragInit, subscribeDragMove, subscribeMove } from "wy-dom-helper";


const useAngle = createUseReducer(function (old: number, act: {
  type: "add"
  value: number
}) {
  if (act.type == 'add') {
    return (360 + old + act.value) % 360
  }
  return old
})
/**
 * 尽可能使用css来实现,因为svg内部不能使用dom的布局
 * 但是css3的圆环,没有圆角?
 * https://www.zhangxinxu.com/study/201711/colorful-circle-by-css-linear-gradient.html
 */
export default function () {


  renderPage({
    title: "circle choose",
    bodyAttr: {
      onTouchMove(event) {
        event.preventDefault()
      },
    }
  }, function () {


    const [start, setStart] = useAngle(0)
    const [end, setEnd] = useAngle(320)
    dom.div({
      style: `
      position:relative;
      width:200px;
      height:200px;
      `,

    }).render(function () {

      function getCenter() {
        const rect = s.getBoundingClientRect()
        return {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        }
      }
      function getPointerAngle(e: {
        pageX: number
        pageY: number
      }) {
        const center = getCenter()
        const vector = {
          x: e.pageX - center.x,
          y: e.pageY - center.y
        }
        const angle = Math.atan2(vector.y, vector.x) * 180 / Math.PI
        return angle
      }

      const lastPoint = useAtom<{
        type: "start" | "end" | "center"
        lastAngle: number
      } | undefined>(undefined)

      useEffect(e => {
        console.log(e, "dd")
        return subscribeDragMove((p, e) => {
          const le = lastPoint.get()
          if (le) {
            if (p) {
              const angle = getPointerAngle(p)
              const diffAngle = angle - le.lastAngle
              if (le.type == 'center') {
                setStart({
                  type: "add",
                  value: diffAngle
                })
                setEnd({
                  type: "add",
                  value: diffAngle
                })
              } else if (le.type == 'start') {
                setStart({
                  type: "add",
                  value: diffAngle
                })
              } else if (le.type == 'end') {
                setEnd({
                  type: "add",
                  value: diffAngle
                })
              }
              lastPoint.set({
                type: le.type,
                lastAngle: angle
              })
            } else {
              lastPoint.set(undefined)
            }
          }
        })
      }, emptyArray)

      // const s = dom.div({
      //   style: `
      //   position:absolute;
      //   `
      // }).render(function () {

      // })
      const s = svg.svg({
        style: `
        position:absolute;
        inset:0;
        `,
        viewBox: "0 0 100 100"
      }).render(function () {
        const r = 40
        const cx = 50
        const cy = 50
        const allWidth = Math.PI * r * 2

        const partWidth = ((end < start ? end + 360 : end) - start) * allWidth / 360
        svg.circle({
          cx,
          cy,
          r,
          strokeWidth: 20,
          stroke: "red",
          fill: "none",
          transform: `rotate(${start - 90}, ${cx}, ${cy})`,
          strokeLinecap: 'round',
          strokeDasharray: partWidth + " " + (allWidth - partWidth),

          ...dragInit(e => {
            lastPoint.set({
              type: "center",
              lastAngle: getPointerAngle(e)
            })
          })
        }).render()
      })

      renderCircleView(100, 30, function (r, height) {
        r = r - 34
        dom.div({
          className: "start",
          style: `
        pointer-events:all;
            position:absolute;
            width:${height}px;
            border-radius:50%;
            background:green;
            height:${height}px;
            transform-origin:-${r}px;
            transform:translate(${r}px) rotate(${start - 90}deg);
            `,
          ...dragInit(e => {
            lastPoint.set({
              type: "start",
              lastAngle: getPointerAngle(e)
            })
          })
        }).render()
        dom.div({
          className: "end",
          style: `
            pointer-events:all;
            position:absolute;
            width:${height}px;
            border-radius:50%;
            background:blue;
            height:${height}px;
            transform-origin:-${r}px;
            transform:translate(${r}px) rotate(${end - 90}deg);
            `,
          ...dragInit(e => {
            lastPoint.set({
              type: "end",
              lastAngle: getPointerAngle(e)
            })
          })
        }).render()
      })

      renderCircleView(100, 2, function (r, height) {
        renderMax(120, quote, function (i) {
          const cS = `
          position:absolute;
          background:gray;
          height:${height}px;
          transform-origin:-${r}px;
          transform:translate(${r}px) rotate(${i * 3 - 90}deg);
          `
          if (i % 5) {
            dom.div({
              style: `
              width:5px;
              ${cS}
              `
            }).render()
          } else {
            dom.div({
              style: `
              width:30px;
              display:flex;
              align-items:center;
              justify-content:flex-end;
              ${cS}`
            }).render(function () {
              dom.div({
                style: `
                position:relative;
                left:30px;
                `
              }).renderText`${i * 3}`
            })
          }
        })
      })
    })
  })
}


function renderCircleView(r: number, height: number, children: (r: number, height: number) => void) {
  dom.div({
    style: `
      position:absolute;
      inset:0;
      transform:translate(${r}px,${r - height / 2}px);
      pointer-events:none;
      `
  }).render(function () {
    children(r, height)
  })
}