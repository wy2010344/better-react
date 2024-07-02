import { dom } from "better-react-dom";
import { renderPage } from "../util/page";
import { addEffectDestroy, renderArray, useAtom, useBeforeAttrHookEffect, useChange, useEffect, useEvent, useHookEffect, useMemo } from "better-react-helper";
import { PointKey, cacheVelocity, easeFns, emptyArray, getSpringBaseAnimationConfig, quote, scrollJudgeDirection, syncMergeCenter } from "wy-helper";
import { animateFrame, subscribeMove } from "wy-dom-helper";


const easeEase = easeFns.out(easeFns.circ)

const DIRECTION_LOCK_THRESHOLD = 5;

function diffIt(n: number, height: number) {
  if (n > height) {
    const diff = (n - height) / 3
    n = height + diff
  }
  return n
}
export default function () {
  renderPage({ title: "complex1-page" }, () => {


    const [index, updateIndex] = useChange(0)
    const bottomContentRef = useAtom<HTMLDivElement | undefined>(undefined)
    const transX = useMemo(() => animateFrame(0), emptyArray)
    useEffect(() => {
      transX.slientChange(0)
    }, [index])
    const { velocityX, velocityY } = useMemo(() => {
      return {
        velocityX: cacheVelocity(),
        velocityY: cacheVelocity()
      }
    }, emptyArray)
    const updateDirection = useEvent((direction: number, velocity = 0) => {
      const width = bottomContentRef.get()!.clientWidth
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

    const [showDrop, setShowDrop] = useChange(false)
    const transY = useMemo(() => animateFrame(0), emptyArray)

    const contentRef = useAtom<HTMLDivElement | undefined>(undefined)
    const changeTransYDiff = useEvent((n: number) => {
      const height = contentRef.get()?.clientHeight! / 2
      if (showDrop) {
        const toDiff = - diffIt(-n, height)
        let toValue = transY.get() + toDiff
        if (toValue > height) {
          return
        } else if (toValue < 0) {
          toValue = 0
          // toValue = transY.get() + toDiff / 3
        }
        transY.changeTo(toValue)
      } else {
        const toDiff = diffIt(n, height)
        let toValue = transY.get() + toDiff
        if (toValue < 0) {
          return
        } else if (toValue > height) {
          toValue = height
          //toValue = transY.get() + toDiff / 3
        }
        transY.changeTo(toValue)
      }
    })

    const transYEnd = useEvent((diffY: number, velocity = 0) => {
      const height = contentRef.get()?.clientHeight! / 2
      if (showDrop) {
        const direction = scrollJudgeDirection(
          diffY,
          transY.get() - height,
          height
        )
        if (direction > 0) {
          setShowDrop(false)
        } else {
          transY.changeTo(height, getSpringBaseAnimationConfig({ initialVelocity: velocity }))
        }
      } else {
        const direction = scrollJudgeDirection(
          diffY,
          transY.get(),
          height
        )
        if (direction < 0) {
          setShowDrop(true)
        } else {
          transY.changeTo(0, getSpringBaseAnimationConfig({ initialVelocity: velocity }))
        }
      }
    })
    useEffect(() => {
      const allHeight = contentRef.get()?.clientHeight! / 2
      const height = showDrop ? allHeight : 0
      transY.changeTo(height, getSpringBaseAnimationConfig())
    }, [showDrop])

    const moveInfo = useAtom<PointerEvent | undefined>(undefined)

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
      `, onPointerDown(e) {
        moveInfo.set(e)
        velocityX.reset(e.timeStamp, e.pageX)
        velocityY.reset(e.timeStamp, e.pageY)
      },
    }).render(() => {

      useBeforeAttrHookEffect(() => {
        contentRef.set(wrapper)
        addEffectDestroy(() => {
          contentRef.set(undefined)
        })
      }, emptyArray)

      const wrapper = dom.div({
        style: `
        height:200%;
        position:absolute;
        left:0;
        right:0;
        display:flex;
        flex-direction:column;
        align-items:stretch;
        `
      }).render(() => {
        dom.div({
          style: `
          flex:1;
          display:flex;
          align-items:center;
          justify-content:center;
          background:radial-gradient(#23e617, transparent);
          `
        }).renderText`top`
        useHookEffect(() => {
          let directionLock: PointKey | undefined = undefined

          addEffectDestroy(subscribeMove(function (e, end) {
            const lastE = moveInfo.get()
            if (lastE) {
              const vx = velocityX.append(e.timeStamp, e.pageX)
              const vy = velocityY.append(e.timeStamp, e.pageY)
              const diffX = e.pageX - lastE.pageX
              const diffY = e.pageY - lastE.pageY

              if (!directionLock) {
                const absX = Math.abs(diffX)
                const absY = Math.abs(diffY)
                if (absX > absY + DIRECTION_LOCK_THRESHOLD) {
                  directionLock = 'x'
                } else if (absY >= absX + DIRECTION_LOCK_THRESHOLD) {
                  directionLock = 'y'
                }
              }
              if (directionLock == 'x') {
                transX.changeTo(transX.get() + diffX)
              } else if (directionLock == 'y') {
                changeTransYDiff(diffY)
              }
              if (directionLock) {
                moveInfo.set(e)
              }

              if (end) {
                if (directionLock == 'x') {
                  const width = bottomContent.clientWidth
                  const direction = scrollJudgeDirection(
                    diffX,
                    transX.get(),
                    width)
                  updateDirection(direction, vx)
                } else if (directionLock == 'y') {
                  transYEnd(diffY, vy)
                }
                directionLock = undefined
                moveInfo.set(undefined)
              }
            }
          }))
          addEffectDestroy(syncMergeCenter(transX, x => {
            bottomContent.style.transform = `translateX(${x}px)`;
          }))
          addEffectDestroy(syncMergeCenter(transY, y => {
            wrapper.style.bottom = -y + 'px'
          }))
        }, emptyArray)

        useBeforeAttrHookEffect(() => {
          bottomContentRef.set(bottomContent)
          addEffectDestroy(() => {
            bottomContentRef.set(undefined)
          })
        }, emptyArray)
        const bottomContent = dom.div({
          style: `
          flex:1;
        `,
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
  })
}