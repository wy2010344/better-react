import { DomAttribute, dom } from "better-react-dom";
import { flushSync, hookCommitAll } from 'better-react'
import { addEffectDestroy, createUseReducer, renderArray, useAtom, useChange, useEffect, useHookEffect, useMemo, useOneEffect, useValueCenter } from "better-react-helper";
import { readArraySliceCircle, arrayCountCreateWith, emptyArray, numberIntFillWithN0, quote, easeFns, momentum, syncMergeCenter, recicleScrollViewView, TweenAnimationConfig } from "wy-helper";
import { animateFrame, cssMap, subscribeMove } from "wy-dom-helper";
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

const ease = new TweenAnimationConfig(300, easeFns.out(easeFns.circ))
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
    const { scroll, setInitScrollHeight, wrapperAdd, trans: transY } = useMemo(() => {
      return recicleScrollViewView(flushSync, n => {
        dispatchIndex({
          type: "add",
          value: n
        })
      }, 26, momentum.iScrollIdeal({
        // deceleration: 0.003
      }), ease.fn, animateFrame(0))
    })

    useHookEffect((e) => {
      const div = wrapperRef.get()!
      const maxScrollheight = div.scrollHeight - div.clientHeight
      const ish = -(maxScrollheight / 2)
      setInitScrollHeight(ish)
      addEffectDestroy(subscribeMove(function (e, end) {
        if (end) {
          scroll.end(e.pageY)
        } else {
          scroll.move(e.pageY)
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
          wrapperAdd(-5, ease)
        }
      }).renderText`-`
      dom.div().renderText`index${index}value${list[index]}`
      dom.button({
        onClick() {
          wrapperAdd(5, ease)
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
        onPointerDown(event) {
          scroll.start(event.pageY)
        },
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