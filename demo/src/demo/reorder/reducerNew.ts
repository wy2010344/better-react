
import { easeFns, arrayMove, syncMergeCenter, emptyArray, arrayNotEqualOrOne, ReorderLocalModel, ReorderLocalElement, AnimateFrameValue, TweenAnimationConfig, } from "wy-helper"
import { dom } from "better-react-dom"
import { addEffectDestroy, createUseReducer, renderArray, useAtom, useAtomFun, useChange, useEffect, useEvent, useHookEffect, useMemo, useStoreTriggerRender, useValueCenterFun } from "better-react-helper"
import renderTimeType, { setTimeType } from "../util/timeType"
import { renderPage } from "../util/page"
import { DataRow, dataList, renderRow } from "./util/share"
import { userReducerLocalChangeReorder } from "./useReduceLocalChangeReorder"
import { hookLevelEffect } from 'better-react'
import { useStyle } from "better-react-dom-helper"
import { animateFrame } from "wy-dom-helper"
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

function getOnMoveKey(vc: ReorderLocalModel<number>) {
  return vc.onMove?.key
}

// let t = 0
export default function () {
  renderPage({
    title: "reducer"
  }, () => {
    const [version, setVersion] = useChange(0)
    const vc = useValueCenterFun<ReorderLocalModel<number>>(() => {
      return {
        scrollTop: 0,
        version: 0,
        gap: 10,
        updateEffect(fun) {
          fun?.()
        },
        changeIndex(from, to, version, fun) {
          console.log("change", from, to)
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
      const list: ReorderLocalElement<number>[] = []
      model.list.map(row => {
        const key = row.index
        const div = map.get(key)
        if (div) {
          list.push(div)
        }
      })
      return list
    }, [model.version])

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
    }).render(function () {
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
            const transY = animateFrame(0)
            return new ReorderE(transY, row.index, div)
          })
          useEffect(() => {
            return syncMergeCenter(transY.value, function (value: number) {
              div.style.transform = `translate(0px,${value}px)`
            })
          }, emptyArray)

          useEffect(() => {
            const key = row.index
            rowMap.get().set(key, transY)
            return () => {
              rowMap.get().delete(key)
            }
          }, emptyArray)
        }
      )
    })
    reOrder.useBody(container, getOrderModel)
  })
}

class ReorderE implements ReorderLocalElement<number> {
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
  silentDiff(v: number): void {
    this.value.slientDiff(v)
  }
  layoutFrom(v: number): void {
    if (this.value.getAnimateTo()) {
      //感觉中止了效果并不是很好
      console.log("stopLayout")
      // return
    }
    this.value.changeTo(0, new TweenAnimationConfig(400, easeFns.out(easeFns.circ)), {
      from: v
    })
  }
  endLayout(): void {
    this.value.changeTo(0, new TweenAnimationConfig(400, easeFns.out(easeFns.circ)))
  }
  getTransY(): number {
    return this.value.get()
  }
}
