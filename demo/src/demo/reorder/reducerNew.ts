import { el, faker } from "@faker-js/faker"
import { AnimateFrameValue, animateNumberFrame, animateNumberFrameReducer, getChangeOnScroll, subscribeEdgeScroll, subscribeMove } from "wy-dom-helper"

import { useEdgeScroll } from "better-react-dom-helper"
import { easeFns, ReorderModel, createReorderReducer, arrayMove, syncMergeCenter, emptyArray, arrayNotEqualOrOne, } from "wy-helper"
import { dom } from "better-react-dom"
import { createUseReducer, renderArray, useAtom, useAtomFun, useEffect, useEvent, useInit, useMemo, useReducer, useSideReducer, useTimeoutAnimateValue } from "better-react-helper"
import renderTimeType, { setTimeType } from "../util/timeType"
import { renderPage } from "../util/page"
import { useReducerReorder } from "./useReduceReorder"
import { DataRow, dataList, renderRow } from "./util/share"
import { ease } from "@/better-scroll/src/utils/ease"
import { ReorderElement } from "./reducerLocalChange"
/**
 * 拖拽的render,依赖拖拽事件,不是react的render与requestAnimateFrame
 * 动画生成异步的,因为dom生效本来是异步的.
 */


function createMap<K, V>() {
  return new Map<K, V>()
}


type NewModel = {
  list: DataRow[]
  version: number
}

const useReducerList = createUseReducer(function (old: NewModel, action: {
  type: "move"
  from: number
  to: number
}) {
  if (action.type == 'move') {
    return {
      list: arrayMove(old.list, action.from, action.to, true),
      version: old.version + 1
    }
  }
  return old
})


function useMemoDepValue<T, D>() {
  const value = useAtom<{
    dep: D,
    value: T
  } | undefined>(undefined)
  return function (
    dep: D,
    get: () => T
  ) {
    let old = value.get()
    if (!old
      || arrayNotEqualOrOne(old.dep, dep)) {
      const v = get()
      value.set({
        dep,
        value: v
      })
      return v
    }
    return old.value
  }
}

function useDelayMemo<T>(get: () => T, dep: any) {
  const set = useMemoDepValue<T, any>()
  return function () {
    return set(dep, get)
  }
}

export default function () {
  renderPage({
    title: "reducer"
  }, () => {


    const [model, dispatch_1] = useReducerList({
      list: dataList,
      version: 0
    })
    const timetype = renderTimeType()
    const dispatch = useEvent(function (arg: Parameters<typeof dispatch_1>[0]) {
      setTimeType(timetype, function () {
        dispatch_1(arg)
      })
    })
    const getOrderModel = useDelayMemo(() => {
      const map = rowMap.get()
      const list: {
        key: number
        div: ReorderElement<number>
      }[] = []
      model.list.map(row => {
        const key = row.index
        const div = map.get(key)
        if (div) {
          list.push({
            key,
            div
          })
        }
      })
      return list
    }, [model.list])

    const rowMap = useAtomFun<Map<number, ReorderE>>(createMap)
    const container = dom.div({
      /**
       * 
      user-select:${orderModel.onMove ? 'none' : 'unset'};
       */
      style: `
      width:300px;
      height:600px;
      overflow:auto;
      background:white;
      `,
      onScroll(event) {
        // reOrder.onScroll(container, getOrderModel())
      },
    }).renderFragment(function () {
      renderArray(
        model.list,
        v => v.index,
        function (row, index) {
          const div = renderRow(row, e => {
            // reOrder.start(e, row.index, container)
          })
          const transY = useMemo(() => {
            const transY = animateNumberFrame(0)
            return new ReorderE(transY, row.index, div)
          })
          useEffect(() => {
            return syncMergeCenter(transY.value, function (value: number) {
              div.style.transform = `translate(0px,${value}px)`
            })
          }, emptyArray)
          useInit(() => {
            const key = row.index
            rowMap.get().set(key, transY)
            return () => {
              rowMap.get().delete(key)
            }
          })
        }
      )
    })
  })
}

class ReorderE implements ReorderElement<number> {
  constructor(
    public readonly value: AnimateFrameValue,
    public readonly key: number,
    public readonly element: HTMLElement
  ) { }
  getHeight(): number {
    return this.element.clientHeight
  }
  changeDiff(diff: number): void {
    this.value.changeTo(this.value.get() + diff)
  }
  layoutFrom(v: number): void {
    this.value.changeTo(0, {
      duration: 400,
      fn: easeFns.out(easeFns.circ),
    }, {
      from: v
    })
  }
  silentDiff(v: number): void {
    this.value.slientDiff(v)
  }
  endLayout(): void {
    this.value.changeTo(0, {
      duration: 400,
      fn: easeFns.out(easeFns.circ),
    })
  }
}
