import { dom, svg } from "better-react-dom";
import { renderPage } from "../util/page";
import { createUseReducer, renderMax, useAtom, useEffect } from "better-react-helper";
import { emptyArray, PagePoint, quote } from "wy-helper";
import { CSSProperties, dragInit, subscribeDragMove } from "wy-dom-helper";
import { cn } from "@/utils";


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
  }, () => {


    const [start, setStart] = useAngle(0)
    const [end, setEnd] = useAngle(320)
    dom.div({
      className: "relative w-[200px] h-[200px]",
    }).render(() => {
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

      // const lastPoint = useAtom<{
      //   type: "start" | "end" | "center"
      //   lastAngle: number
      // } | undefined>(undefined)

      function startDrag(e: PagePoint, type: "start" | "end" | "center") {
        let lastAngle = getPointerAngle(e)
        const destroy = subscribeDragMove((p, e) => {
          if (p) {
            const angle = getPointerAngle(p)
            const diffAngle = angle - lastAngle
            if (type == 'center') {
              setStart({
                type: "add",
                value: diffAngle
              })
              setEnd({
                type: "add",
                value: diffAngle
              })
            } else if (type == 'start') {
              setStart({
                type: "add",
                value: diffAngle
              })
            } else if (type == 'end') {
              setEnd({
                type: "add",
                value: diffAngle
              })
            }
            lastAngle = angle
          } else {
            destroy()
          }
        })
      }
      const s = svg.svg({
        className: "absolute inset-0",
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
            startDrag(e, 'center')
          })
        }).render()
      })

      renderCircleView(100, 30, function (r, height) {
        r = r - 34
        dom.div({
          className: "start pointer-events-auto absolute rounded-[50%] bg-green-400",
          style: {
            width: `${height}px`,
            height: `${height}px`,
            transformOrigin: `-${r}px`,
            transform: `translate(${r}px) rotate(${start - 90}deg)`
          },
          ...dragInit(e => {
            startDrag(e, 'start')
          })
        }).render()
        dom.div({
          className: "end pointer-events-auto absolute rounded-[50%] bg-blue-600",
          style: {
            width: `${height}px`,
            height: `${height}px`,
            transformOrigin: `-${r}px`,
            transform: `translate(${r}px) rotate(${end - 90}deg)`
          },
          ...dragInit(e => {
            startDrag(e, 'end')
          })
        }).render()
      })

      renderCircleView(100, 2, function (r, height) {
        renderMax(120, quote, function (i) {
          const cs: CSSProperties = {
            height: height + "px",
            transformOrigin: `-${r}px`,
            transform: `translate(${r}px) rotate(${i * 3 - 90}deg)`
          }
          if (i % 5) {
            dom.div({
              className: "absolute bg-gray-400 w-1",
              style: cs
            }).render()
          } else {
            dom.div({
              className: cn("absolute bg-gray-400 w-8 flex items-center justify-end"),
              style: cs
            }).render(function () {
              dom.div({
                className: "relative left-8"
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
    className: "absolute inset-0 pointer-events-none",
    style: {
      transform: `translate(${r}px,${r - height / 2}px)`
    }
  }).render(function () {
    children(r, height)
  })
}