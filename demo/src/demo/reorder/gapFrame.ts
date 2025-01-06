import { faker } from "@faker-js/faker"
import { dom } from "better-react-dom"
import { addEffectDestroy, createUseReducer, renderArray, useAtom, useChange, useEffect, useHookEffect, useMemo, useValueCenter } from "better-react-helper"
import { Point, arrayMove, easeFns, emptyArray, getTweenAnimationConfig, pointZero, syncMergeCenterArray } from "wy-helper"

import { animateFrame, moveEdgeScroll, requesetBatchAnimationForceFlow, subscribeDragMove, subscribeEventListener, subscribeMove, subscribeScrollerAll } from "wy-dom-helper"
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
    const useChild = useReorderFix(
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
    }).render(function () {
      renderArray(orderList, v => v.index, function (row, index) {
        const offsetY = useValueCenter(0)
        const transY = useMemo(() => animateFrame(0), emptyArray)
        const reOrderChild = useChild(
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
          //每次坐标改变,都恢复
          offsetY.set(0)
        }, index)
        useHookEffect(() => {
          addEffectDestroy(syncMergeCenterArray([transY, offsetY] as const, function ([value, oy]) {
            div.style.transform = `translate(0px,${(value + oy)}px)`
          }))
        }, emptyArray)
        const div = renderRow(row, e => {
          // transX.changeTo(e.pageY - cb.get()!.y.min)
          setOnMove(row)
          const mv = reOrderChild({
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
          const destroyScroll = subscribeScrollerAll(container, mv.setMoveDiff)
          const mes = moveEdgeScroll(e.pageY, {
            direction: "y",
            container,
            config: {
              padding: 10,
              config: true
            }
          })
          const endMove = subscribeEventListener(document, 'pointermove', e => {
            mv.move({
              x: e.pageX,
              y: e.pageY
            })
            mes.changePoint(e.pageY)
          })
          const endUp = subscribeEventListener(document, 'pointerup', e => {
            mv.end()
            endMove()
            endUp()
            destroyScroll()
            mes.destroy()
          })
        }, true)
        useStyle(div, {
          zIndex: onMove?.index == row.index ? 1 : 0
        })
      })

    })
  })

}
