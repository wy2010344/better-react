import { dom } from "better-react-dom";
import { renderPage } from "../util/page";
import { dataList, renderRow, useReduceList } from "./util/share";
import { addEffectDestroy, effectSetPromise, renderArray, renderArrayToArray, renderArrayToMap, useEffect, useHookEffect, useMemo, useRef, useValueCenter } from "better-react-helper";
import { animateFrame, getChangeOnScroll, PagePoint, subscribeDragMove, subscribeEdgeScroll, subscribeMove } from "wy-dom-helper";
import { AnimateFrameValue, arrayEqual, arrayMove, arrayNotEqualOrOne, easeFns, emptyArray, getSpringBaseAnimationConfig, getTweenAnimationConfig, rangeBetweenLeft, rangeBetweenRight, reorderCheckTarget, simpleEqual, syncMergeCenter } from "wy-helper";
import { number } from "zod";

const spring = getTweenAnimationConfig(400, easeFns.out(easeFns.circ))

type InfoList = {
  key: number
  div: HTMLElement
  transY: AnimateFrameValue
}
export default function () {
  renderPage({
    title: "endToMove"
  }, () => {


    const [orderList, dispatch] = useReduceList(dataList)
    const moveInfo = useValueCenter<{
      key: number,
      transY: AnimateFrameValue
      lastPoint: PagePoint
      finished?: boolean
    }>()
    const scroller = useMemo(() => {
      let lastY: {
        value: number
      } | undefined = undefined
      return getChangeOnScroll(e => {
        const info = moveInfo.get()
        if (info && !info.finished) {
          if (lastY) {
            const diff = e.y - lastY.value
            lastY.value = e.y
            info.transY.slientDiff(diff)
          } else {
            lastY = {
              value: e.y
            }
          }
        } else {
          lastY = undefined
        }
      })
    }, emptyArray)
    const container = dom.div({
      style: {
        width: '300px',
        height: '600px',
        overflow: 'auto',
        background: 'white',
        position: 'relative'
      },
      onTouchMove(e) {
        e.preventDefault()
      },
      onScroll(event) {
        scroller.onScroll(container)
      },
    }).render((container) => {
      useHookEffect(() => {
        function getHeight(n: InfoList) {
          return n.div.clientHeight + 2
        }
        let gap = 10

        addEffectDestroy(subscribeEdgeScroll(() => {
          const info = moveInfo.get()
          if (info && !info.finished) {
            const point = info.lastPoint
            return {
              point: point.pageY,
              direction: "y",
              container,
              config: {
                padding: 10,
                config: true
              }
            }
          }
        }))

        const { didDrag, didEnd } = buildEndMove({
          gap,
          getHeight,
          getTransValue(n) {
            return n.transY.get()
          },
          layoutTo(n, target) {
            return n.transY.animateTo(target, spring)
          },
        })
        addEffectDestroy(subscribeDragMove(e => {
          const info = moveInfo.get()
          if (info && !info.finished) {
            if (e) {
              const diff = e.pageY - info.lastPoint.pageY
              info.transY.changeTo(info.transY.get() + diff)
              const idx = outList.findIndex(v => v.key == info.key)
              didDrag(outList, idx)
              info.lastPoint = e
            } else {
              const idx = outList.findIndex(v => v.key == info.key)
              const { promises, change } = didEnd(outList, idx)
              info.finished = true
              Promise.all(promises).then(() => {
                moveInfo.set(undefined)
                if (change) {
                  effectSetPromise(dispatch, {
                    type: "change",
                    from: outList[change[0]].key,
                    to: outList[change[1]].key
                  }).then(() => {
                    outList.forEach(row => {
                      row.transY.changeTo(0)
                    })
                  })
                }
              })
            }
          }
        }))
        addEffectDestroy(syncMergeCenter(moveInfo, info => {
          if (info && !info.finished) {
            container.style.userSelect = 'none'
          } else {
            container.style.userSelect = ''
          }
        }))
      }, orderList)
      const outList = renderArrayToArray(orderList, v => v.index, function (row, index) {
        useHookEffect(() => {
          addEffectDestroy(syncMergeCenter(transY, function (oy) {
            div.style.transform = `translate(0px,${(oy)}px)`
          }))
          addEffectDestroy(syncMergeCenter(moveInfo, info => {
            if (info?.key == row.index) {
              div.style.zIndex = "1"
            } else {
              div.style.zIndex = "0"
            }
          }))
        }, emptyArray)
        const transY = useMemo(() => animateFrame(0), emptyArray)
        const div = renderRow(row, e => {
          if (moveInfo.get()) {
            return
          }
          scroller.reset(container)
          moveInfo.set({
            key: row.index,
            transY,
            lastPoint: e,
          })
        })
        return {
          key: row.index,
          transY,
          div
        }
      })
    })
  })
}


function buildEndMove<T>({
  getHeight,
  gap,
  getTransValue,
  layoutTo,
  endLayout = layoutTo
}: {
  getHeight(n: T): number,
  gap: number,
  getTransValue(n: T): number
  layoutTo(n: T, target: number): Promise<any> | void
  endLayout?(n: T, target: number): Promise<any> | void
}) {
  let tempOut: {
    change?: readonly [number, number],
    list: T[],
    promises: Promise<any>[]
  } | undefined = undefined
  function didDrag(infoList: T[], idx: number) {
    const row = infoList[idx]
    const change = reorderCheckTarget(
      infoList,
      idx,
      getHeight,
      getTransValue(row),
      { gap }
    )
    if (tempOut && !arrayNotEqualOrOne(change, tempOut?.change)) {
      return tempOut
    }
    const promises: Promise<any>[] = []

    function thisLayoutTo(n: T, target: number) {
      const promise = layoutTo(n, target)
      if (promise) {
        promises.push(promise)
      }
    }
    let list: T[] = infoList
    if (change) {
      const [idx, idx1] = change
      list = arrayMove(infoList, idx, idx1, true)
      const diffHeight = getHeight(list[idx1]) + gap

      if (idx < idx1) {
        for (let i = 0; i < idx; i++) {
          thisLayoutTo(list[i], 0)
          // promises.push(list[i].transY.animateTo(0, spring))
        }
        for (let i = idx; i < idx1; i++) {
          thisLayoutTo(list[i], -diffHeight)
        }
        for (let i = idx1 + 1; i < list.length; i++) {
          thisLayoutTo(list[i], 0)
        }
      } else {
        for (let i = 0; i < idx1; i++) {
          thisLayoutTo(list[i], 0)
        }
        const sendIdx = idx + 1
        for (let i = idx1 + 1; i < sendIdx; i++) {
          thisLayoutTo(list[i], diffHeight)
        }
        for (let i = sendIdx; i < list.length; i++) {
          thisLayoutTo(list[i], 0)
        }
      }
    } else {
      for (let i = 0; i < infoList.length; i++) {
        if (i != idx) {
          thisLayoutTo(list[i], 0)
        }
      }
    }
    tempOut = {
      list,
      change,
      promises
    }
    return tempOut
  }

  function didEnd(infoList: T[], idx: number) {
    const target = didDrag(infoList, idx)
    const { change, list: targetList, promises } = target
    function thisLayoutTo(n: T, target: number) {
      const promise = endLayout(n, target)
      if (promise) {
        promises.push(promise)
      }
    }
    if (change) {
      const [idx, idx1] = change
      let diffHeight = 0
      rangeBetweenLeft(idx, idx1, function (i) {
        const row = targetList[i]
        const height = getHeight(row)
        diffHeight = diffHeight + height + gap
      })
      if (idx > idx1) {
        diffHeight = -diffHeight
      }
      thisLayoutTo(infoList[idx], diffHeight)
    } else {
      thisLayoutTo(infoList[idx], 0)
    }
    return target
  }

  return {
    didDrag,
    didEnd
  }
}