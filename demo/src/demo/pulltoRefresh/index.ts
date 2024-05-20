import { useAtom, useChange, useEffect, useMemo, useValueCenter } from "better-react-helper";
import { renderPage } from "../util/page";
import { animateFrame, subscribeMove, subscribeRequestAnimationFrame } from "wy-dom-helper";
import { dom } from "better-react-dom";
import { easeFns, emptyArray, syncMergeCenter, syncMergeCenterArray } from "wy-helper";

const easeEase = easeFns.out(easeFns.circ)


/**
 * https://codepen.io/raphael_octau/pen/jepzgo
 * 一般有拖拽阶段
 *  拖拽双分为未到临界值,到达临界值.在这个状态变化的时候,也可以加个动画
 *  这种拖拽,有减速度,有最大目标位置
 * 未到临界值释放
 *  (动画)回归原位
 * 到达临界值释放
 *  (动画)进入loading界面
 * loading完成
 *  (动画)回归主界面
 */
export default function () {
  renderPage({ title: "pulltorefresh" }, () => {




    const [loading, setLoading] = useChange(false)
    const transY = useMemo(() => animateFrame(0))
    const loadingValue = useValueCenter(0)

    useEffect(() => {
      if (loading) {
        const v = performance.now()
        const nv = subscribeRequestAnimationFrame((n) => {
          loadingValue.set((n - v) / 10)
        })
        setTimeout(() => {
          nv()
          setLoading(false)
        }, 3000)
      } else {
        transY.changeTo(0, {
          duration: 300,
          fn: easeEase
        })
      }
    }, [loading])

    const lastPoint = useAtom<PointerEvent | undefined>(undefined)
    useEffect(() => {
      const mv = subscribeMove(function (e, end) {
        const le = lastPoint.get()
        if (le) {
          const diffY = e.pageY - le.pageY

          const toValue = transY.get() + diffY / 3
          if (toValue >= 0) {
            transY.changeTo(toValue)
          }
          lastPoint.set(e)
          if (end) {
            const ty = transY.get()
            if (ty > 80) {
              setLoading(true)
              transY.changeTo(80, {
                duration: 300,
                fn: easeEase
              })
            } else {
              transY.changeTo(0, {
                duration: 600,
                fn: easeEase
              })
            }
            lastPoint.set(undefined)
          }
        }
      })
      const di = syncMergeCenter(transY, y => {
        div.style.transform = `translateY(${y}px)`
      })
      const dv = syncMergeCenterArray([transY, loadingValue], ([a, b]) => {
        if (transY.getAnimateTo()?.target == 0) {
          a = 80 - a
        }
        indi.style.transform = `rotate(${a + b}deg)`
      })
      return () => {
        mv()
        di()
        dv()
      }
    }, emptyArray)
    const indi = dom.div({
      style: `
      position:absolute;
      top:0;
      width:30px;
      height:30px;
      background:green;
      `
    }).render(() => {

    })
    const div = dom.div({
      style: `
      width:100%;
      height:100%;
      background:gray;
      `,
      onPointerDown(e) {
        if (loading) {
          return
        }
        lastPoint.set(e)
      }
    }).render(() => {

    })
  })
}