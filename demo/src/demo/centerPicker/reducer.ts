
import { dom } from "better-react-dom"
import { renderArray, useEffect, useMemo, useSideReducer } from "better-react-helper"
import { recycleScrollListReducer, cssMap, initRecycleListModel, subscribeMove } from "wy-dom-helper"
import { arrayCountCreateWith, buildNoEdgeScroll, easeFns, emptyArray, momentum, numberIntFillWithN0, quote, readArraySliceCircle } from "wy-helper"

const list = arrayCountCreateWith(60, v => v + 1)
const rowHeight = 26
export default function () {


  const [{ transY, index }, dispatch] = useSideReducer(recycleScrollListReducer, initRecycleListModel)
  let wrapperDiv: HTMLDivElement
  const scroll = useMemo(() => buildNoEdgeScroll({
    changeDiff(diff, duration) {
      dispatch({
        type: "changeDiff",
        diff,
        config: typeof duration == 'number' ? {
          duration,
          fn: easeFns.out(easeFns.circ)
        } : undefined
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
      config: {
        duration: 600,
        fn: easeFns.out(easeFns.circ)
      }
    })
  }
  dom.div({
    style: `
      display:flex;
      align-items;center;
      `
  }).renderFragment(function () {
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
  }).renderFragment(function () {
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
    }).renderFragment(function () {
      dom.div({
        style: `
          transform:translateY(${transY.value}px);
          `
      }).renderFragment(function () {
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
    }).renderFragment(function () {
      dom.div({
        style: `
          height:26px;
          background:green;
          opacity:0.4;
          `
      }).render()
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