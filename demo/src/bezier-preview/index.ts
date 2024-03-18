import { dom } from "better-react-dom"
import { createUseReducer, renderArray, useEffect } from "better-react-helper"
import { Point, emptyArray, pointEqual, quote } from "wy-helper"



const cacheKey = 'bezier-preview-cache'


function curEqual(a: [Point, Point], b: [Point, Point]) {
  return pointEqual(a[0], b[0]) && pointEqual(a[1], b[1])
}
const useCacheList = createUseReducer(function (list: [Point, Point][], action: {
  action: "add"
  value: [Point, Point]
} | {
  action: "remove"
  value: [Point, Point]
}) {
  if (action.action == 'add') {
    if (list.find(v => curEqual(v, action.value))) {
      return list
    }
    return [...list, action.value]
  } else if (action.action == 'remove') {
    return list.filter(v => !curEqual(v, action.value))
  }
  return list
}, function (i: number) {
  const v = localStorage.getItem(cacheKey)
  if (v) {
    return JSON.parse(v)
  }
  return emptyArray as string[]
})
export default function () {

  const [list, dispatch] = useCacheList(0)

  useEffect(() => {
    localStorage.setItem(cacheKey, JSON.stringify(list))
  }, [list])

  dom.div().render(function () {
    const input = dom.input().render()
    dom.button({
      onClick() {
        const value = input.value.trim()
        if (value) {
          const sps = value.split(',').map(v => Number(v.trim()))
          if (sps.length == 4) {
            if (sps.some(v => Number.isNaN(v))) {
              return
            }
            dispatch({
              action: "add",
              value: [
                {
                  x: sps[0],
                  y: sps[1]
                },
                {
                  x: sps[2],
                  y: sps[3]
                }
              ]
            })
            input.value = ''
          }
        }
      }
    }).renderText`添加`
  })
  renderArray(list, quote, function (row) {
    dom.div().render(function () {

      dom.div().render(function () {
        dom.span().renderText`curbe-bezier(${row[0].x},${row[0].y},${row[1].x},${row[1].y})`
        dom.button({
          onClick() {
            dispatch({
              action: "remove",
              value: row
            })
          }
        }).renderText`删除`
      })


      const scale = 100
      useEffect(() => {
        const ctx = canvas.getContext("2d")
        if (ctx) {
          ctx.lineWidth = 2
          ctx.moveTo(scale, scale)
          ctx.bezierCurveTo(
            row[0].x * scale + scale,
            row[0].y * scale + scale,

            row[1].x * scale + scale,
            row[1].y * scale + scale,

            scale * 2,
            scale * 2,
          )
          ctx.stroke()
        }
      }, emptyArray)
      const canvas = dom.canvas({
        width: scale * 3,
        height: scale * 3
      }).render()

    })
  })
}