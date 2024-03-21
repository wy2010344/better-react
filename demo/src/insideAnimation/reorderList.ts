import { faker } from "@faker-js/faker"
import { dom } from "better-react-dom"
import { createUseReducer, renderArray, useAtom, useChange, useEffect, useTimeoutAnimateValue } from "better-react-helper"
import { Point, arrayToMove, emptyArray, pointEqual, pointZero, syncMergeCenter } from "wy-helper"
import { useEdgeScroll } from "./edgeScroll"
import { requesetBatchAnimationForceFlow } from "wy-dom-helper"
import { useReorder } from 'better-react-dom-helper'
/**
 * 拖拽的render,依赖拖拽事件,不是react的render与requestAnimateFrame
 * 动画生成异步的,因为dom生效本来是异步的.
 */

const list = Array(100).fill(1).map((_, i) => {
  return {
    index: i,
    name: faker.person.fullName(),
    avatar: faker.image.urlLoremFlickr({
      width: 100,
      height: 100,
      category: 'orchid'
    })
  }
})
type Row = {
  index: number
  name: string
  avatar: string
}



const useReduceList = createUseReducer(function (list: Row[], action: {
  type: "change"
  value: number
  base: number
}) {
  if (action.type == 'change') {
    const idx = list.findIndex(v => v.index == action.value)
    if (idx < 0) {
      return list
    }
    const idx1 = list.findIndex(v => v.index == action.base)
    if (idx1 < 0) {
      return list
    }
    return arrayToMove(list, idx, idx1)
  }
  return list
})
export default function () {
  const [orderList, dispatch] = useReduceList(list)

  return dom.div({
    style: `
    display:flex;
    align-items:center;
    justify-content:center;
    height:100vh;
    background:gray;
    `,
    onTouchMove(event) {
      event.preventDefault()
    },
  }).render(function () {
    const reOrder = useReorder('y',
      function (key) {
        return !orderList.some(v => v.index == key)
      },
      function (itemKey, baseKey) {
        dispatch({
          type: "change",
          value: itemKey,
          base: baseKey
        })
      })
    const [onMove, setOnMove] = useChange<{ index: number }>()

    const setPoint = useEdgeScroll(() => container, {
      y: true,
      padding: 10
    })
    useEffect(() => {
      function move(e: PointerEvent) {
        const p = {
          x: e.pageX,
          y: e.pageY
        }
        if (reOrder.move(p)) {
          setPoint(p)
        }
      }
      function end(e: PointerEvent) {
        if (reOrder.end({
          x: e.pageX,
          y: e.pageY
        })) {
          setOnMove(undefined)
          setPoint(undefined)
        }
      }

      window.addEventListener("pointermove", move)
      window.addEventListener("pointerup", end)
      window.addEventListener("pointercancel", end)
      return function () {
        window.removeEventListener("pointermove", move)
        window.removeEventListener("pointerup", end)
        window.removeEventListener("pointercancel", end)
      }
    }, emptyArray)
    const container = dom.div({
      style: `
      width:300px;
      height:600px;
      overflow:auto;
      background:white;
      user-select:${onMove ? 'none' : 'unset'};
      `,
      onScroll(event) {
        reOrder.onScroll(container)
      },
    }).render(function () {
      renderArray(orderList, v => v.index, function (row, index) {
        const transY = useTimeoutAnimateValue<Point, string>(pointZero, pointEqual)
        const reOrderChild = reOrder.useChild(
          row.index,
          index,
          () => div,
          function () {
            return transY.get().value
          },
          function (value) {
            transY.changeTo(value)
          }, function (diff) {
            transY.changeTo(diff)
            requesetBatchAnimationForceFlow(div, function () {
              transY.changeTo(pointZero, {
                duration: 600,
                value: 'ease'
              })
            })
          })
        useEffect(() => {
          return syncMergeCenter(transY, function (value) {
            if (value.config) {
              div.style.transition = `transform ${value.config.value} ${value.config.duration}ms`
            } else {
              div.style.transition = ''
            }
            div.style.transform = `translate(0px,${value.value.y}px)`
          })
        }, emptyArray)
        const div = dom.div({
          style: `
    display:flex;
    align-items:center;
    margin-top:10px;
    background:yellow;
    position:relative;
    z-index:${onMove?.index == row.index ? 1 : 0};
    `,
          onPointerDown(e) {
            // transX.changeTo(e.pageY - cb.get()!.y.min)
            setOnMove(row)
            reOrderChild({
              x: e.pageX,
              y: e.pageY
            }, function () {
              transY.changeTo(pointZero, {
                duration: 600,
                value: "ease"
              })
            })
          }
        }).render(function () {
          dom.img({
            src: row.avatar
          }).render()

          dom.span().renderText`${row.name}`
        })
      })
    })
  })
}
