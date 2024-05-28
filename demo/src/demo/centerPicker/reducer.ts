
import { dom } from "better-react-dom"
import { addEffectDestroy, renderArray, useEffect, useHookEffect, useMemo, useSideReducer } from "better-react-helper"
import { recycleScrollListReducer, cssMap, subscribeMove } from "wy-dom-helper"
import { TweenAnimationConfig, arrayCountCreateWith, buildNoEdgeScroll, easeFns, emptyArray, initRecycleListModel, momentum, numberIntFillWithN0, quote, readArraySliceCircle } from "wy-helper"
import { renderPage } from "../util/page"

const list = arrayCountCreateWith(60, v => v + 1)
const rowHeight = 26
const easeFn = easeFns.out(easeFns.circ)
export default function () {
  renderPage({
    title: "reducer"
  }, () => {

    const [{ transY, index }, dispatch] = useSideReducer(recycleScrollListReducer, initRecycleListModel)
    let wrapperDiv: HTMLDivElement
    const scroll = useMemo(() => buildNoEdgeScroll({
      changeDiff(diff, duration) {
        dispatch({
          type: "changeDiff",
          diff,
          config: typeof duration == 'number' ? new TweenAnimationConfig(duration, easeFn) : undefined
        })
      },
      momentum: momentum.iScrollIdeal({
        // deceleration: 0.003
      })
    }))
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

      return subscribeMove(function (e, end) {
        if (end) {
          scroll.end(e.pageY)
        } else {
          scroll.move(e.pageY)
        }
      })
    }, emptyArray)
    const wrapperAdd = (value: number) => {
      dispatch({
        type: "addIndex",
        value,
        config: new TweenAnimationConfig(600, easeFn)
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
        onPointerDown(event) {
          scroll.start(event.pageY)
        },
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