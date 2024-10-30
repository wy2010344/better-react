
import { dom } from "better-react-dom"
import { renderArray, useAtom, useEffect, useMemo, useSideReducer } from "better-react-helper"
import { recycleScrollListReducer, cssMap, subscribeMove, initDrag, dragInit, PagePoint, subscribeDragMove } from "wy-dom-helper"
import { FrictionalFactory, arrayCountCreateWith, cacheVelocity, easeFns, emptyArray, getSpringBaseAnimationConfig, getTweenAnimationConfig, initRecycleListModel, numberIntFillWithN0, quote, readArraySliceCircle } from "wy-helper"
import { renderPage } from "../util/page"

const list = arrayCountCreateWith(60, v => v + 1)
const rowHeight = 26

// const ease = getTweenAnimationConfig(400, easeFns.out(easeFns.quad))
const fc = new FrictionalFactory()
function fcGet(n: number) {
  return fc.getFromDistance(n).animationConfig()
}
export default function () {
  renderPage({
    title: "reducer"
  }, () => {

    const [{ transY, index }, dispatch] = useSideReducer(recycleScrollListReducer, initRecycleListModel)
    let wrapperDiv: HTMLDivElement
    // const scroll = useMemo(() => buildNoEdgeScroll({
    //   changeDiff(diff, duration) {
    //     dispatch({
    //       type: "changeDiff",
    //       diff,
    //       config: typeof duration == 'number' ? getTweenAnimationConfig(duration, easeFn) : undefined
    //     })
    //   },
    //   momentum: momentum.iScrollIdeal({
    //     // deceleration: 0.003
    //   })
    // }))

    const { velocity } = useMemo(() => {
      return {
        velocity: cacheVelocity()
      }
    }, emptyArray)
    const lastPoint = useAtom<PagePoint | undefined>(undefined)
    useEffect((e) => {
      const div = wrapperDiv
      const maxScrollheight = div.scrollHeight - div.clientHeight
      const ish = -(maxScrollheight / 2)

      dispatch({
        type: "init",
        transY: ish,
        size: list.length,
        cellHeight: rowHeight
      })

      return subscribeDragMove(function (m, e) {
        const lp = lastPoint.get()
        if (lp) {
          if (m) {
            velocity.append(e.timeStamp, m.pageY)
            const diffY = m.pageY - lp.pageY
            dispatch({
              type: "changeDiff",
              diff: diffY
            })
          } else {
            dispatch({
              type: "endMove",
              idealDistance: fc.getFromVelocity(velocity.get()).maxDistance,
              getConfig(distance) {
                // return getSpringBaseAnimationConfig()(distance)
                return fc.getFromDistance(distance).animationConfig()
              },
            })
          }
          lastPoint.set(m)
        }
      })
    }, emptyArray)
    const wrapperAdd = (value: number) => {
      dispatch({
        type: "addIndex",
        value,
        getConfig: fcGet
      })
    }
    dom.div({
      style: `
      display:flex;
      align-items;center;
      `
    }).render(function () {
      dom.button({
        onClick() {
          wrapperAdd(-5)
        }
      }).renderText`-`
      dom.div().renderText`index${index}value${list[index]}`
      dom.button({
        onClick() {
          wrapperAdd(5)
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
      wrapperDiv = dom.div({
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
        dom.div({
          style: `
          transform:translateY(${transY.value}px);
          `
        }).render(function () {
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
      })
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