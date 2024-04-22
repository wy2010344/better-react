import { faker } from "@faker-js/faker"
import { dom } from "better-react-dom"
import { createUseReducer, renderArray, renderFragment, useAtom, useChange, useEffect, useTimeoutAnimateValue } from "better-react-helper"
import { Point, arrayToMove, emptyArray, pointEqual, pointZero, quote, syncMergeCenter } from "wy-helper"
import { useEdgeScroll } from "./edgeScroll"
import { requesetBatchAnimationForceFlow } from "wy-dom-helper"
import { useReorder } from 'better-react-dom-helper'
import { useStyle, useOnMove } from "better-react-dom-helper"
import { flushSync } from "better-react"
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
  }).renderFragment(function () {

    const [orderList, dispatch] = useReduceList(list)
    const [onMove, setOnMove] = useChange<{ index: number }>()
    const reOrder = useReorder(
      'y',
      orderList,
      v => v.index,
      function (itemKey, baseKey) {
        dispatch({
          type: "change",
          value: itemKey,
          base: baseKey
        })
        // flushSync(() => {
        //   dispatch({
        //     type: "change",
        //     value: itemKey,
        //     base: baseKey
        //   })
        // })
      })
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
    }).renderFragment(function () {
      const setPoint = useEdgeScroll(() => container, {
        y: true,
        padding: 10
      })

      useOnMove(function (e, end) {
        const p = {
          x: e.pageX,
          y: e.pageY
        }
        if (end) {
          if (reOrder.end(p)) {
            setPoint(undefined)
          }
        } else {
          if (reOrder.move(p)) {
            setPoint(p)
          }
        }
      })
      renderArray(orderList, v => v.index, function (row, index) {
        const transY = useTimeoutAnimateValue<Point, string>(pointZero, pointEqual)
        const reOrderChild = reOrder.useChild(
          row.index,
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
              }, function (bool) {
                if (bool) {
                  setOnMove(undefined)
                }
              })
            })
          }
        }).renderFragment(function () {
          dom.img({
            src: row.avatar
          }).render()
          dom.span().renderText`${row.name}`
        })
        /**
         * 
            z-index:${onMove?.index == row.index ? 1 : 0};
         */
        useStyle(div, {
          zIndex: onMove?.index == row.index ? 1 : 0
        })
      })

    })
  })
}
