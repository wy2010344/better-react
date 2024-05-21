import { faker } from "@faker-js/faker"
import { dom } from "better-react-dom"
import { addEffectDestroy, createUseReducer, renderArray, useAtom, useChange, useEffect, useHookEffect, useTimeoutAnimateValue } from "better-react-helper"
import { Point, arrayMove, emptyArray, pointEqual, pointZero, syncMergeCenter } from "wy-helper"

import { requesetBatchAnimationForceFlow, subscribeEdgeScroll, subscribeMove } from "wy-dom-helper"
import { useReorder } from 'better-react-dom-helper'
import { useStyle } from "better-react-dom-helper"
import renderTimeType, { setTimeType } from "../util/timeType"
import { renderPage } from "../util/page"
import { DataRow, dataList, renderRow } from "./util/share"
/**
 * 拖拽的render,依赖拖拽事件,不是react的render与requestAnimateFrame
 * 动画生成异步的,因为dom生效本来是异步的.
 */


const useReduceList = createUseReducer(function (list: DataRow[], action: {
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
    return arrayMove(list, idx, idx1, true)
  }
  return list
})

export default function () {

  renderPage({ title: "frame" }, () => {
    const timetype = renderTimeType()
    const [orderList, dispatch] = useReduceList(dataList)
    const [onMove, setOnMove] = useChange<{ index: number }>()
    const reOrder = useReorder(
      orderList,
      v => v.index,
      function (itemKey, baseKey) {
        setTimeType(timetype, function () {
          dispatch({
            type: "change",
            value: itemKey,
            base: baseKey
          })
        })
      })
    const container = dom.div({
      style: `
      flex:1;
      width:300px;
      overflow:auto;
      background:white;
      user-select:${onMove ? 'none' : 'unset'};
      `,
      onScroll(event) {
        reOrder.scroller.onScroll(container)
      },
    }).render(function () {
      const point = useAtom<Point | undefined>(undefined)
      useHookEffect(() => {
        addEffectDestroy(subscribeEdgeScroll(() => {
          const info = point.get()
          if (info) {
            return {
              point: info.y,
              direction: "y",
              container,
              config: {
                padding: 10,
                config: true
              }
            }
          }
        }))
      })


      useHookEffect(() => {
        addEffectDestroy(subscribeMove(function (e, end) {
          const p = {
            x: e.pageX,
            y: e.pageY
          }
          if (end) {
            if (reOrder.end(p)) {
              point.set(undefined)
            }
          } else {
            if (reOrder.move(p)) {
              point.set(p)
            }
          }
        }))
      }, emptyArray)
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
          },
          function (diff) {
            transY.changeTo(diff)

            //使用animate接口来创建动画,感觉有一些闪烁???
            // transY.changeTo(pointZero, {
            //   duration: 600,
            //   value: 'ease'
            // })
            //使用回流来触发动画
            requesetBatchAnimationForceFlow(div, function () {
              transY.changeTo(pointZero, {
                duration: 600,
                value: 'ease'
              })
            })
          })
        useEffect(() => {
          addEffectDestroy(syncMergeCenter(transY, function (value) {
            // if (value.config) {
            //   div.animate([
            //     {
            //       transform: `translate(0px,${value.value.y}px)`
            //     }
            //   ], {
            //     duration: value.config.duration,
            //     easing: value.config.value
            //   })
            // } else {
            //   div.getAnimations().map(v => v.cancel())
            //   div.style.transform = `translate(0px,${value.value.y}px)`
            // }
            if (value.config) {
              div.style.transition = `transform ${value.config.value} ${value.config.duration}ms`
            } else {
              div.style.transition = ''
            }
            div.style.transform = `translate(0px,${value.value.y}px)`
          }))
        }, emptyArray)
        const div = renderRow(row, e => {
          // transX.changeTo(e.pageY - cb.get()!.y.min)
          setOnMove(row)
          reOrder.scroller.reset(container)
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
