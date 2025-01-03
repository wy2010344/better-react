
import { easeFns, arrayMove, syncMergeCenter, emptyArray, arrayNotEqualOrOne, ReorderLocalModel, ReorderLocalElement, AnimateFrameValue, getTweenAnimationConfig, } from "wy-helper"
import { dom } from "better-react-dom"
import { createUseReducer, renderArrayToArray, useAtom, useChange, useEffect, useEvent, useMemo, useStoreTriggerRender, useValueCenterFun } from "better-react-helper"
import renderTimeType, { setTimeType } from "../util/timeType"
import { renderPage } from "../util/page"
import { DataRow, dataList, renderRow } from "./util/share"
import { userReducerLocalChangeReorder } from "./useReduceLocalChangeReorder"
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

    const reOrder = userReducerLocalChangeReorder(version, vc)
    const { container, list } = dom.div({
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
        reOrder.onScroll(container, list)
      },
    }).renderOut(container => {
      return {
        container,
        list: renderArrayToArray(
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
            }, emptyArray)
            useEffect(() => {
              return syncMergeCenter(transY.value, function (value: number) {
                div.style.transform = `translate(0px,${value}px)`
              })
            }, emptyArray)
            return transY
          }
        )
      }
    })
    reOrder.useBody(container, useEvent(() => list))
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
    /**
     * 这里是立即变化,但dom没有变化,所以有闪烁
     * 
     * 因为react的异步
     * 最好的方法,是累积到effect阶段去slientDiff
     */
    this.value.slientDiff(v)
  }
  layoutFrom(v: number): void {
    this.value.changeTo(0, getTweenAnimationConfig(400, easeFns.out(easeFns.circ)), {
      from: v
    })
  }
  endLayout(): void {
    this.value.changeTo(0, getTweenAnimationConfig(400, easeFns.out(easeFns.circ)))
  }
  getTransY(): number {
    return this.value.get()
  }
}
