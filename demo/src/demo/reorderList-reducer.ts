import { faker } from "@faker-js/faker"
import { animateNumberFrameReducer, getChangeOnScroll, subscribeMove } from "wy-dom-helper"

import { useEdgeScroll, usePageOffsetChange } from "better-react-dom-helper"
import { Point, easeFns, emptyArray, removeWhere, AnimateNumberFrameAction, ReorderModel, createReorderReducer, } from "wy-helper"
import { dom } from "better-react-dom"
import { renderArray, useAtom, useAtomFun, useAttrEvent, useEffect, useEvent, useInit, useMemo, useSideReducer } from "better-react-helper"
import renderTimeType, { setTimeType } from "./util/timeType"
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

const orderReducer = createReorderReducer(
  (v: Row) => v.index,
  {
    duration: 500,
    fn: easeFns.out(easeFns.circ)
  },
  animateNumberFrameReducer,
  (v: HTMLElement) => v.clientHeight,
  (after: HTMLElement, before: HTMLElement) => after.offsetTop - before.offsetTop
)

function initValue(): ReorderModel<Row, number> {
  return {
    list: list.map(value => {
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

  const [orderModel, dispatch_1] = useSideReducer(orderReducer<ReorderModel<Row, number>>, '', initValue)

  const timetype = renderTimeType()

  const dispatch: typeof dispatch_1 = useEvent(function (arg) {
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




  const diffOnScroll = useMemo(() => getChangeOnScroll(function (p) {
    dispatch({
      type: "changeDiff",
      elements: getOrderModel(),
      diffY: p.y
    })
  }))
  const container = dom.div({
    style: `
      width:300px;
      height:600px;
      overflow:auto;
      background:white;
      user-select:${orderModel.onMove ? 'none' : 'unset'};
      `,
    onScroll(event) {
      diffOnScroll(container)
    },
  }).renderFragment(function () {
    useEdgeScroll(
      useEvent(() => orderModel.onMove?.info?.lastPoint),
      () => container,
      {
        y: true,
        padding: 10
      })
    useEffect(() => {
      return subscribeMove(function (e, end) {
        const p = {
          x: e.pageX,
          y: e.pageY
        }
        dispatch({
          type: "didMove",
          point: p,
          elements: getOrderModel(),
          end: end ? {
            duration: 400,
            fn: easeFns.out(easeFns.circ)
          } : undefined,
        })
      })
    })



    renderArray(
      orderModel.list,
      v => v.value.index,
      function (row, index) {
        const height = 100 + row.value.index % 3 * 4
        const div = dom.div({
          style: `
            height:${height}px;
    display:flex;
    align-items:center;
    margin-top:10px;
    background:yellow;
    position:relative;
    transform:translate(0px,${row.transY.value}px);
    z-index: ${orderModel.onMove?.key == row.value.index ? 1 : 0};
    `,
          onPointerDown(e) {
            dispatch({
              type: "moveBegin",
              key: row.value.index,
              point: {
                x: e.pageX,
                y: e.pageY
              }
            })
          }
        }).renderFragment(function () {
          dom.img({
            src: row.value.avatar
          }).render()
          dom.span().renderText`${height}`
          dom.span().renderText`${row.value.name}`
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
}
