import { dom } from "better-react-dom";
import { renderPage } from "../util/page";
import { addEffectDestroy, renderArray, useAtom, useBeforeAttrHookEffect, useChange, useEffect, useEvent, useHookEffect, useMemo } from "better-react-helper";
import { cacheVelocity, easeFns, emptyArray, getSpringBaseAnimationConfig, quote, scrollJudgeDirection, syncMergeCenter } from "wy-helper";
import { animateFrame, subscribeMove } from "wy-dom-helper";
export default function () {
  renderPage({ title: "simple-page" }, () => {


    const [index, updateIndex] = useChange(0)

    const wrapperRef = useAtom<HTMLDivElement | undefined>(undefined)
    const transX = useMemo(() => animateFrame(0), emptyArray)
    const updateDirection = useEvent((direction: number, velocity = 0) => {
      const width = wrapperRef.get()!.clientWidth
      if (direction < 0) {
        updateIndex(index - 1)
        transX.changeTo(width, getSpringBaseAnimationConfig({ initialVelocity: velocity }))
      } else if (direction > 0) {
        updateIndex(index + 1)
        transX.changeTo(-width, getSpringBaseAnimationConfig({ initialVelocity: velocity }))
      } else {
        transX.changeTo(0, getSpringBaseAnimationConfig({ initialVelocity: velocity }))
      }
    })
    dom.div().render(() => {
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
    }).render(() => {
      useEffect(() => {
        transX.slientChange(0)
      }, [index])
      const { velocityX } = useMemo(() => {
        return {
          velocityX: cacheVelocity()
        }
      }, emptyArray)
      const moveInfo = useAtom<PointerEvent | undefined>(undefined)
      useHookEffect(() => {
        addEffectDestroy(subscribeMove(function (e, end) {
          const lastE = moveInfo.get()
          if (lastE) {
            const vx = velocityX.append(e.timeStamp, e.pageX)
            const diff = e.pageX - lastE.pageX
            transX.changeTo(transX.get() + diff)
            if (end) {
              const width = wrapper.clientWidth
              const direction = scrollJudgeDirection(
                diff,
                transX.get(),
                width)
              updateDirection(direction, vx)
            }
            moveInfo.set(e)
          }
        }))
        addEffectDestroy(syncMergeCenter(transX, x => {
          wrapper.style.transform = `translateX(${x}px)`;
        }))
      }, emptyArray)

      useBeforeAttrHookEffect(() => {
        wrapperRef.set(wrapper)
        addEffectDestroy(() => {
          wrapperRef.set(undefined)
        })
      }, emptyArray)
      const wrapper = dom.div({
        style: `
        height:100%;
        `,
        onPointerDown(e) {
          moveInfo.set(e)
          velocityX.reset(e.timeStamp, e.pageX)
        },
      }).render(() => {
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
          }).render(() => {

            dom.h1().renderText`${row}`

          })
        })
      })
    })
  })
}