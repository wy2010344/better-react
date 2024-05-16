import { AnimateFrameValue, animateNumberFrame } from "wy-dom-helper"

import { easeFns, arrayMove, syncMergeCenter, emptyArray, arrayNotEqualOrOne, } from "wy-helper"
import { dom } from "better-react-dom"
import { createUseReducer, renderArray, useAtom, useAtomFun, useChange, useEffect, useEvent, useInit, useMemo, useStoreTriggerRender, useValueCenterFun } from "better-react-helper"
import renderTimeType, { setTimeType } from "../util/timeType"
import { renderPage } from "../util/page"
import { DataRow, dataList, renderRow } from "./util/share"
import { ReorderElement, ReorderModel } from "./reducerLocalChange"
import { userReducerLocalChangeReorder } from "./useReduceLocalChangeReorder"
import { hookLevelEffect } from 'better-react'
import { useStyle } from "better-react-dom-helper"
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

function getOnMoveKey(vc: ReorderModel<number>) {
  return vc.onMove?.key
}

let t = 0
export default function () {
  renderPage({
    title: "reducer"
  }, () => {
    console.log("render--", ++t)
    const [version, setVersion] = useChange(0)
    const vc = useValueCenterFun<ReorderModel<number>>(() => {
      return {
        scrollTop: 0,
        version: 0,
        gap: 10,
        updateEffect(fun) {
          fun?.()
        },
        changeIndex(from, to, version, fun) {
          dispatch({
            type: "move",
            from,
            to
          })
          fun?.()
          setTimeType(timetype, function () {
            setVersion(version)
          })
        }
      }
    })

    const onMoveKey = useStoreTriggerRender(vc, getOnMoveKey)
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
      const list: ReorderElement<number>[] = []
      model.list.map(row => {
        const key = row.index
        const div = map.get(key)
        if (div) {
          list.push(div)
        }
      })
      return list
    }, [model.list])

    const rowMap = useAtomFun<Map<number, ReorderE>>(createMap)
    const reOrder = userReducerLocalChangeReorder(version, vc)
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
      user-select:${typeof onMoveKey == 'number' ? 'none' : 'unset'};
      `,
      onScroll(event) {
        reOrder.onScroll(container, getOrderModel())
      },
    }).renderFragment(function () {
      renderArray(
        model.list,
        v => v.index,
        function (row, index) {
          const div = renderRow(row, e => {
            reOrder.start(e, row.index, container)
          })
          const height = 100 + row.index % 3 * 20
          useStyle(div, {
            height: height + 'px',
            zIndex: onMoveKey == row.index ? 1 : 0
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
      reOrder.useBody(container, getOrderModel)
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
    return this.element.clientHeight + 2
  }
  changeDiff(diff: number): void {
    this.value.changeTo(this.value.get() + diff)
  }
  onAnimate(): boolean {
    return !!this.value.getAnimateTo()
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
  getTransY(): number {
    return this.value.get()
  }
}
