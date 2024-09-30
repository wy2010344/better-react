import { faker } from "@faker-js/faker"
import { dom } from "better-react-dom"
import { addEffectDestroy, createUseReducer, renderArray, useAtom, useChange, useEffect, useHookEffect, useMemo, useValueCenter } from "better-react-helper"
import { Point, arrayMove, easeFns, emptyArray, getTweenAnimationConfig, pointZero, syncMergeCenterArray } from "wy-helper"

import { animateFrame, requesetBatchAnimationForceFlow, subscribeDragMove, subscribeEdgeScroll, subscribeMove } from "wy-dom-helper"
import { useStyle, useReorderFix } from "better-react-dom-helper"
import renderTimeType, { setTimeType } from "../util/timeType"
import { renderPage } from "../util/page"
import { DataRow, dataList, renderRow, useReduceList } from "./util/share"
/**
 * 拖拽的render,依赖拖拽事件,不是react的render与requestAnimateFrame
 * 动画生成异步的,因为dom生效本来是异步的.
 */

export default function () {

  renderPage({ title: "frame" }, () => {
    const timetype = renderTimeType()
    const [orderList, dispatch] = useReduceList(dataList)
    const [onMove, setOnMove] = useChange<{ index: number }>()
    const reOrder = useReorderFix(
      orderList,
      v => v.index,
      102,
      function (itemKey, targetKey) {
        setTimeType(timetype, function () {
          dispatch({
            type: "change",
            from: itemKey,
            to: targetKey
          })
        })
      }, {
      gap: 10,
      // endToMove: true
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
        addEffectDestroy(subscribeDragMove(e => {
          if (e) {
            const p = {
              x: e.pageX,
              y: e.pageY
            }
            if (reOrder.move(p)) {
              point.set(p)
            }
          } else {
            if (reOrder.end()) {
              point.set(undefined)
            }
          }
        }))
      }, emptyArray)
      renderArray(orderList, v => v.index, function (row, index) {
        const offsetY = useValueCenter(0)
        const transY = useMemo(() => animateFrame(0), emptyArray)
        const reOrderChild = reOrder.useChild(
          row.index,
          function () {
            return {
              y: transY.get(),
              x: 0
            }
          },
          function (value) {
            transY.changeTo(value)
            requesetBatchAnimationForceFlow(div, function () {
              transY.changeTo(0, getTweenAnimationConfig(600, easeFns.out(easeFns.circ)))
            })
          },
          function (value) {
            transY.changeTo(value.y)
          },
          () => offsetY.get(),
          (v) => offsetY.set(v)
        )
        useEffect(() => {
          //恢复
          offsetY.set(0)
        })
        useHookEffect(() => {
          addEffectDestroy(syncMergeCenterArray([transY, offsetY] as const, function ([value, oy]) {
            div.style.transform = `translate(0px,${(value + oy)}px)`
          }))
        }, emptyArray)
        const div = renderRow(row, e => {
          reOrder.scroller.reset(container)
          // transX.changeTo(e.pageY - cb.get()!.y.min)
          setOnMove(row)
          reOrderChild({
            x: e.pageX,
            y: e.pageY
          }, function () {
            transY.changeTo(0, getTweenAnimationConfig(600, easeFns.out(easeFns.circ)), {
              onFinish(bool) {
                if (bool) {
                  setOnMove(undefined)
                }
              },
            })
          })
        })
        useStyle(div, {
          zIndex: onMove?.index == row.index ? 1 : 0
        })
      })

    })
  })

}
