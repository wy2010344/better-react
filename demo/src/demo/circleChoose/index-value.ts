import { dom, svg } from "better-react-dom";
import { renderPage } from "../util/page";
import { renderMax, useAtom, useConst, useConstDep, useEffect, useMemo, useSignalSync, useSignalSyncDep, useSignalSyncTemplate } from "better-react-helper";
import { batchSignal, emptyArray, quote, Signal, } from "wy-helper";
import { CSSProperties, dragInit, subscribeDragMove } from "wy-dom-helper";
function useAngle(n: number) {
  return useMemo(() => {
    const s = Signal(n)
    return [s.get, (n: number) => {
      return s.set((360 + s.get() + n) % 360)
    }] as const
  }, emptyArray)
}
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

    const [startValue, addStart] = useAngle(0)
    const [endValue, addEnd] = useAngle(320)
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

      const lastPoint = useAtom<{
        type: "start" | "end" | "center"
        lastAngle: number
      } | undefined>(undefined)

      useEffect(e => {
        return subscribeDragMove((p, e) => {
          const le = lastPoint.get()
          if (le) {
            if (p) {
              const angle = getPointerAngle(p)
              const diffAngle = angle - le.lastAngle
              batchSignal(() => {
                if (le.type == 'center') {
                  addStart(diffAngle)
                  addEnd(diffAngle)
                } else if (le.type == 'start') {
                  addStart(diffAngle)
                } else if (le.type == 'end') {
                  addEnd(diffAngle)
                }
              })
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
      const s = svg.svg({
        className: "absolute inset-0",
        viewBox: "0 0 100 100"
      }).render(function () {
        const r = 40
        const cx = 50
        const cy = 50
        const allWidth = Math.PI * r * 2

        const strokeDasharray = useSignalSync(() => {
          const end = endValue()
          const start = startValue()
          const partWidth = ((end < start ? end + 360 : end) - start) * allWidth / 360
          return partWidth + " " + (allWidth - partWidth)
        })
        svg.circle({
          cx,
          cy,
          r,
          strokeWidth: 20,
          stroke: "red",
          fill: "none",
          transform: useSignalSyncTemplate`rotate(${useConst(() => startValue() - 90)}, ${cx}, ${cy})`,
          strokeLinecap: 'round',
          strokeDasharray,

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
          className: "start pointer-events-auto absolute rounded-[50%] bg-green-400",
          style: {
            width: `${height}px`,
            height: `${height}px`,
            transformOrigin: `-${r}px`,
            transform: useSignalSyncDep(() => `translate(${r}px) rotate(${startValue() - 90}deg)`, [r])
          },
          ...dragInit(e => {
            lastPoint.set({
              type: "start",
              lastAngle: getPointerAngle(e)
            })
          })
        }).render()
        dom.div({
          className: "end pointer-events-auto absolute rounded-[50%] bg-blue-600",
          style: {
            width: `${height}px`,
            height: `${height}px`,
            transformOrigin: `-${r}px`,
            transform: useSignalSyncDep(() => `translate(${r}px) rotate(${endValue() - 90}deg)`, [r])
          },
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
              className: "absolute bg-gray-400 w-8 flex items-center justify-end",
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