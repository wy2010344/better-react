import { dom } from "better-react-dom"
import { addEffectDestroy, renderArray, useChange, useEffect, useHookEffect, useTimeoutAnimateValue, useValueCenter } from "better-react-helper"
import { Point, emptyArray, pointEqual, pointZero, syncMergeCenterArray } from "wy-helper"

import { moveEdgeScroll, requesetBatchAnimationForceFlow, subscribeEventListener, subscribeScrollerAll } from "wy-dom-helper"
import { useStyle, useReorderFix } from "better-react-dom-helper"
import renderTimeType, { setTimeType } from "../util/timeType"
import { renderPage } from "../util/page"
import { dataList, renderRow, useReduceList } from "./util/share"
/**
 * 拖拽的render,依赖拖拽事件,不是react的render与requestAnimateFrame
 * 动画生成异步的,因为dom生效本来是异步的.
 * 
 * 会闪烁
 * 
 * 只支持固定高度的
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
      },
      {
        gap: 10,
        endToMove: true
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
        const transY = useTimeoutAnimateValue<Point, string>(pointZero, pointEqual)
        const reOrderChild = useChild(
          row.index,
          function () {
            return transY.get().value
          },
          function (value) {
            transY.changeTo({
              x: transY.get().value.x,
              y: value
            })
            requesetBatchAnimationForceFlow(div, function () {
              transY.changeTo(pointZero, {
                duration: 600,
                value: 'ease'
              })
            })
          },
          function (value) {
            transY.changeTo(value)
          },
          () => offsetY.get(),
          (v) => offsetY.set(v)
        )
        // function (diff) {
        //   transY.changeTo(diff)
        //   //使用回流来触发动画
        //   requesetBatchAnimationForceFlow(div, function () {
        //     transY.changeTo(pointZero, {
        //       duration: 600,
        //       value: 'ease'
        //     })
        //   })
        // })
        useEffect(() => {
          //恢复
          offsetY.set(0)
        }, index)
        useHookEffect(() => {
          addEffectDestroy(syncMergeCenterArray([transY, offsetY] as const, function ([value, oy]) {
            if (value.config) {
              div.style.transition = `transform ${value.config.value} ${value.config.duration}ms`
            } else {
              div.style.transition = ''
            }
            div.style.transform = `translate(0px,${(value.value.y + oy)}px)`
          }))
        }, emptyArray)
        const div = renderRow(row, e => {
          // transX.changeTo(e.pageY - cb.get()!.y.min)
          setOnMove(row)
          const mv = reOrderChild({
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
