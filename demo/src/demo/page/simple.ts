import { dom } from "better-react-dom";
import { renderPage } from "../util/page";
import { renderArray, useAnimateValue, useAtom, useBeforeAttrEffect, useChange, useEffect, useEvent, useMemo } from "better-react-helper";
import { easeFns, emptyArray, quote, scrollJudgeDirection, syncMergeCenter } from "wy-helper";
import { animateFrame, subscribeMove } from "wy-dom-helper";


const easeEase = easeFns.out(easeFns.circ)

export default function () {
  renderPage({ title: "simple-page" }, () => {


    const [index, updateIndex] = useChange(0)

    const wrapperRef = useAtom<HTMLDivElement | undefined>(undefined)
    const transX = useMemo(() => animateFrame(0))
    const updateDirection = useEvent((direction: number) => {
      const width = wrapperRef.get()!.clientWidth
      if (direction < 0) {
        updateIndex(index - 1)
        transX.changeTo(width, {
          duration: 500,
          fn: easeEase
        })
      } else if (direction > 0) {
        updateIndex(index + 1)
        transX.changeTo(-width, {
          duration: 500,
          fn: easeEase
        })
      } else {
        transX.changeTo(0, {
          duration: 500,
          fn: easeEase
        })
      }
    })
    dom.div().renderFragment(() => {
      dom.button({
        onClick() {
          updateDirection(-1)
        }
      }).renderText`-`
      dom.button({
        onClick() {
          updateDirection(1)
        }
      }).renderText`+`
    })
    dom.div({
      style: `
      position:relative;
      width:100%;
      height:300px;
      overflow:hidden;
      `
    }).renderFragment(() => {
      useEffect(() => {
        transX.slientChange(0)
      }, [index])
      const moveInfo = useAtom<PointerEvent | undefined>(undefined)
      useEffect(() => {
        const di = subscribeMove(function (e, end) {
          const lastE = moveInfo.get()
          if (lastE) {
            const diff = e.pageX - lastE.pageX
            const diffTime = e.timeStamp - lastE.timeStamp
            transX.changeTo(transX.get() + diff)
            if (end) {
              const width = wrapper.clientWidth
              console.log("diff", diff, diffTime, e, width)
              const direction = scrollJudgeDirection(
                diff,
                transX.get(),
                width)
              updateDirection(direction)
              moveInfo.set(undefined)
            } else {
              moveInfo.set(e)
            }
          }
        })
        const dm = syncMergeCenter(transX, x => {
          wrapper.style.transform = `translateX(${x}px)`;
        })
        return function () {
          di()
          dm()
        }
      }, emptyArray)

      useBeforeAttrEffect(() => {
        wrapperRef.set(wrapper)
        return () => {
          wrapperRef.set(undefined)
        }
      }, emptyArray)
      const wrapper = dom.div({
        style: `
        height:100%;
        `,
        onPointerDown(e) {
          moveInfo.set(e)
        },
      }).renderFragment(() => {
        renderArray([index - 1, index, index + 1], quote, function (row, i) {
          let s = ''
          if (i < 1) {
            s = `transform: translateX(-100%);`
          } else if (i > 1) {
            s = `transform: translateX(100%);`
          }
          dom.div({
            style: `
          display:flex;
          align-items:center;
          justify-content:center;
          position:absolute;
          background:radial-gradient(#ee7c7c, transparent);
          inset:0;
          ${s}
          `
          }).renderFragment(() => {

            dom.h1().renderText`${row}`

          })
        })
      })
    })
  })
}