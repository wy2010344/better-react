import dragMove from "@/insideAnimation/dragMove";
import { dom, renderCanvas } from "better-react-dom";
import { useEffect, useMemo, useValueCenter } from "better-react-helper";
import { initDrag } from "wy-dom-helper";
import { mb } from "wy-dom-helper/contentEditable";
import { EmptyFun, Point, emptyArray, pointZero, syncMergeCenter } from "wy-helper";






/**
 * 贝塞尔,两个点
 * @param row 
 */

const scale = 100
const bScale = scale * 0.5


function drawCanvas(
  renderTitle: () => void,
  fun: (ctx: CanvasRenderingContext2D) => void,
  deps: readonly any[] = emptyArray
) {

  const container = dom.div({
    style: `
    position:relative;
    `
  }).renderFragment(function () {

    dom.div().renderFragment(function () {

      const point = useValueCenter(pointZero)

      const div = dom.div({
        style: `
        display:inline-block;
        width:30px;
        height:30px;
        cursor:move;
        background:gray;
        `,
      }).render()

      useEffect(() => {
        const dest = initDrag(div, {
          diff(x, y) {
            const p = point.get()
            point.set({
              x: p.x + x,
              y: p.y + y
            })
          }
        })
        const d1 = syncMergeCenter(point, function (p) {
          container.style.left = p.x + 'px'
          container.style.top = p.y + 'px'
        })
        return function () {
          dest()
          d1()
        }
      }, emptyArray)
      renderTitle()
    })
    const canvas = dom.canvas({
      width: scale * 2,
      height: scale * 2
    }).render()
    useEffect(() => {
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.reset()
        // 将坐标原点移动到画布的左下角
        ctx.translate(0, canvas.height);

        // 将 y 轴翻转
        ctx.scale(1, -1);
        ctx.lineWidth = 2


        fun(ctx)

        ctx.beginPath()
        ctx.moveTo(bScale, bScale)
        ctx.lineTo(bScale, bScale + scale)
        ctx.strokeStyle = 'red'
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(bScale, bScale)
        ctx.lineTo(bScale + scale, bScale)
        ctx.strokeStyle = 'green'
        ctx.stroke()
      }
    }, deps)
  })
}

export function bezierCanvas(
  renderTitle: EmptyFun,
  ...rows: readonly (readonly [Point, Point])[]
) {
  drawCanvas(renderTitle, function (ctx) {
    for (const row of rows) {
      ctx.moveTo(bScale, bScale)
      ctx.bezierCurveTo(
        row[0].x * scale + bScale,
        row[0].y * scale + bScale,

        row[1].x * scale + bScale,
        row[1].y * scale + bScale,

        scale + bScale,
        scale + bScale,
      )
      ctx.stroke()
    }
  })
}


export function funCanvas(
  renderTitle: EmptyFun,
  ...fns: readonly ((n: number) => number)[]) {
  drawCanvas(renderTitle,
    function (ctx) {
      for (const fn of fns) {
        ctx.moveTo(bScale, bScale)
        for (let i = 0; i < scale; i++) {
          ctx.lineTo(bScale + i, bScale + fn(i / 100) * 100)
        }
        ctx.stroke()
      }
    }, fns)
}