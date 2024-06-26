import { dom } from "better-react-dom";
import { flushSync } from 'better-react'
import { addEffectDestroy, createUseReducer, renderArray, useAtom, useHookEffect, useMemo } from "better-react-helper";
import { readArraySliceCircle, arrayCountCreateWith, emptyArray, numberIntFillWithN0, quote, syncMergeCenter, recicleScrollViewView, cacheVelocity, FrictionalFactory, getSpringBaseAnimationConfig, easeFns, getTweenAnimationConfig } from "wy-helper";
import { PagePoint, animateFrame, cssMap, dragInit, subscribeDragMove, subscribeMove } from "wy-dom-helper";
import { renderPage } from "../util/page";
const list = arrayCountCreateWith(60, v => v + 1)

const useIndex = createUseReducer(function (value: number, action: {
  type: "add"
  value: number
}) {
  if (action.type == 'add') {
    let nv = value + action.value
    while (nv < 0) {
      nv = nv + list.length
    }
    while (nv >= list.length) {
      nv = nv - list.length
    }
    return nv
  }
  return value
})

// const ease = getSpringBaseAnimationConfig({
//   // velocityThreshold: 10,
//   // displacementThreshold: 0.5
// })
// const ease = getTweenAnimationConfig(400, easeFns.out(easeFns.quad))
const fc = new FrictionalFactory()
function fcGet(n: number) {
  return fc.getFromDistance(n).animationConfig()
}
export default function () {
  renderPage({
    title: "flushSync",
    bodyAttr: {
      onMouseMove(e) {
        e.preventDefault()
      }
    }
  }, () => {
    const [index, dispatchIndex] = useIndex(0)

    /**
     * 有时会阻塞,猜测是动画不能顺利结束导导导导致的
     */
    const { setInitScrollHeight,
      wrapperAdd, trans: transY,
      moveUpdate,
      endMove
    } = useMemo(() => {
      return recicleScrollViewView(flushSync, n => {
        dispatchIndex({
          type: "add",
          value: n
        })
      }, 26, animateFrame(0))
    })

    const { velocity } = useMemo(() => {
      return {
        velocity: cacheVelocity()
      }
    })
    const lastPoint = useAtom<PagePoint | undefined>(undefined)
    useHookEffect((e) => {
      const div = wrapperRef.get()!
      const maxScrollheight = div.scrollHeight - div.clientHeight
      const ish = -(maxScrollheight / 2)
      setInitScrollHeight(ish)
      addEffectDestroy(subscribeDragMove(function (m, e) {
        const lp = lastPoint.get()
        if (lp) {
          if (m) {
            velocity.append(e.timeStamp, m.pageY)
            const diffY = m.pageY - lp.pageY
            moveUpdate(diffY)
          } else {
            endMove(fc.getFromVelocity(velocity.get()).maxDistance, distance => {
              console.log("sss", distance)
              return fc.getFromDistance(distance).animationConfig()
            })
          }
          lastPoint.set(m)
        }
      }))
      const contaier = containerRef.get()!
      addEffectDestroy(syncMergeCenter(transY, function (v) {
        contaier.style.transform = `translateY(${v}px)`
      }))
    }, emptyArray)
    const wrapperRef = useAtom<HTMLDivElement | undefined>(undefined)
    const containerRef = useAtom<HTMLDivElement | undefined>(undefined)
    dom.div({
      style: `
      display:flex;
      align-items;center;
      `
    }).render(function () {
      dom.button({
        onClick() {
          wrapperAdd(-5, fcGet)
        }
      }).renderText`-`
      dom.div().renderText`index${index}value${list[index]}`
      dom.button({
        onClick() {
          /**
           * 最后一次滚动有点慢,但其实很早就生效了,是要等到最后一次render结束才执行?不明白
           * 当然和动画曲线本身也有一点关系
           * 也许不应该用spring动画,应该用比较平滑一点的动画
           * 应该使用摩擦运动的匀减速动画,和拖拽一致
           */
          wrapperAdd(5, fcGet)
        }

      }).renderText`+`
    })
    dom.div({
      style: `
      background:white;
      width:300px;
      height:200px;
      position:relative;
      `
    }).render(function () {
      const div = dom.div({
        className: cls.scroll,
        style: `
        position:absolute;
        inset:0;
        user-select: none;
        overflow:hidden;
      `,
        ...(dragInit((m, e) => {
          velocity.reset(e.timeStamp, m.pageY)
          lastPoint.set(m)
        })),
      }).render(function () {
        const container = dom.div().render(function () {
          const cacheList = useMemo(() => {
            return readArraySliceCircle(list, index - 5, index + 6)
          }, index)
          renderArray(cacheList, quote, function (row, i) {
            dom.div({
              style: `
          height:25px;
          text-align:center;
          border-bottom:1px solid gray;
          scroll-snap-align:center;
          `
            }).renderText`${numberIntFillWithN0(row, 2)}`
          })
        })
        containerRef.set(container)
      })
      wrapperRef.set(div)
      dom.div({
        style: `
        position:absolute;
        display:flex;
        inset:0;
        flex-direction:column;
        align-items:stretch;
        justify-content:center;
        pointer-events:none;
        `
      }).render(function () {
        dom.div({
          style: `
          height:26px;
          background:green;
          opacity:0.4;
          `
        }).render()
      })
    })
  })
}

const cls = cssMap({
  scroll: `
  &::-webkit-scrollbar {
  display: none;
}
  `
})