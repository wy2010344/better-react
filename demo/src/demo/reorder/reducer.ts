import { faker } from "@faker-js/faker"
import { animateNumberFrameReducer, getChangeOnScroll, subscribeEdgeScroll, subscribeMove } from "wy-dom-helper"

import { easeFns, ReorderModel, createReorderReducer, } from "wy-helper"
import { dom } from "better-react-dom"
import { renderArray, useAtom, useAtomFun, useEffect, useEvent, useInit, useMemo, useSideReducer } from "better-react-helper"
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
  {
    duration: 500,
    fn: easeFns.out(easeFns.circ)
  },
  animateNumberFrameReducer,
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

function createMap<K, V>() {
  return new Map<K, V>()
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
    const getOrderModel = useEvent(() => {
      const map = rowMap.get()
      const list: {
        key: number
        div: HTMLElement
      }[] = []

      orderModel.list.map(row => {
        const key = row.value.index
        const div = map.get(key)
        if (div) {
          list.push({
            key,
            div
          })
        }
      })
      return list
    })
    const rowMap = useAtomFun<Map<number, HTMLElement>>(createMap)
    const reOrder = useReducerReorder(orderModel, dispatch)
    const container = dom.div({
      style: `
      width:300px;
      height:600px;
      overflow:auto;
      background:white;
      user-select:${orderModel.onMove ? 'none' : 'unset'};
      `,
      onScroll(event) {
        reOrder.onScroll(container, getOrderModel())
      },
    }).renderFragment(function () {
      renderArray(
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
          useInit(() => {
            const key = row.value.index
            rowMap.get().set(key, div)
            return () => {
              rowMap.get().delete(key)
            }
          })
          return {
            div,
            key: row.value.index
          }
        }
      )
    })
    reOrder.useBody(container, getOrderModel)
  })
}
