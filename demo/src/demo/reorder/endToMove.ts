import { dom } from "better-react-dom";
import { renderPage } from "../util/page";
import { dataList, renderRow, useReduceList } from "./util/share";
import { addEffectDestroy, effectSetPromise, renderArray, renderArrayToArray, renderArrayToMap, useEffect, useHookEffect, useMemo, useRef, useValueCenter } from "better-react-helper";
import { animateFrame, moveEdgeScroll, PagePoint, subscribeDragMove, subscribeMove } from "wy-dom-helper";
import { AnimateFrameValue, arrayEqual, arrayMove, arrayNotEqualOrOne, buildEndToMove, easeFns, emptyArray, getSpringBaseAnimationConfig, getTweenAnimationConfig, rangeBetweenLeft, rangeBetweenRight, reorderCheckTarget, simpleEqual, syncMergeCenter } from "wy-helper";
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
    }).render((container) => {
      useHookEffect(() => {
        function getHeight(n: InfoList) {
          return n.div.clientHeight + 2
        }
        let gap = 10
        const [didDrag, didEnd] = buildEndToMove({
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
              moveEdgeScroll(e.pageY, {
                direction: "y",
                container,
                config: {
                  padding: 10,
                  config: true
                }
              })
              const diff = e.pageY - info.lastPoint.pageY
              info.transY.changeTo(info.transY.get() + diff)
              const idx = outList.findIndex(v => v.key == info.key)
              didDrag(outList, idx)
              info.lastPoint = e
            } else {
              const idx = outList.findIndex(v => v.key == info.key)
              const callback = didEnd(outList, idx)
              info.finished = true
              callback(change => {
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