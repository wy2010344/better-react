import { animateFrameReducer } from "wy-dom-helper"

import { easeFns, ReorderModel, createReorderReducer, getTweenAnimationConfig, } from "wy-helper"
import { dom } from "better-react-dom"
import { renderArrayToArray, useEvent, useSideReducer } from "better-react-helper"
import renderTimeType, { setTimeType } from "../util/timeType"
import { renderPage } from "../util/page"
import { useReducerReorder } from "./useReduceReorder"
import { DataRow, dataList, renderRow } from "./util/share"
import { useStyle } from "better-react-dom-helper"
/**
 * 拖拽的render,依赖拖拽事件,不是react的render与requestAnimateFrame
 * 动画生成异步的,因为dom生效本来是异步的.
 */
const orderReducer = createReorderReducer(
  (v: DataRow) => v.index,
  getTweenAnimationConfig(500, easeFns.out(easeFns.circ)),
  animateFrameReducer,
  (v: HTMLElement) => v.clientHeight + 2
)

function initValue(): ReorderModel<DataRow, number> {
  return {
    gap: 10,
    version: 0,
    scrollTop: 0,
    list: dataList.map(value => {
      return {
        transY: {
          value: 0,
          version: 0
        },
        value
      }
    })
  }
}
export default function () {
  renderPage({
    title: "reducer"
  }, () => {
    const [orderModel, dispatch_1] = useSideReducer(orderReducer<ReorderModel<DataRow, number>>, '', initValue, undefined,
      function (update, fun, set) {
        update(1, function () {
          fun(dispatch)
        })
      }
    )
    const timetype = renderTimeType()
    const dispatch = useEvent(function (arg: Parameters<typeof dispatch_1>[0]) {
      setTimeType(timetype, function () {
        dispatch_1(arg)
      })
    })
    const reOrder = useReducerReorder(orderModel, dispatch)
    const { container, list } = dom.div({
      style: `
      width:300px;
      height:600px;
      overflow:auto;
      background:white;
      user-select:${orderModel.onMove ? 'none' : 'unset'};
      `,
      onTouchMove(event) {
        event.preventDefault()
      },
      onScroll(event) {
        reOrder.onScroll(container, list)
      },
    }).renderOut((container) => {
      return {
        container,
        list: renderArrayToArray(
          orderModel.list,
          v => v.value.index,
          function (row, index) {
            const div = renderRow(row.value, e => {
              reOrder.start(e, row.value.index, container)
            })
            const height = 100 + row.value.index % 3 * 20
            useStyle(div, {
              height: height + 'px',
              transform: `translate(0px,${row.transY.value}px)`,
              zIndex: orderModel.onMove?.key == row.value.index ? 1 : 0
            })
            return {
              div,
              key: row.value.index
            }
          }
        )
      }
    })
    reOrder.useBody(container, useEvent(() => list))
  })
}
