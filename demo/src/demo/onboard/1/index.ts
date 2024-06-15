import { renderPage } from "@/demo/util/page";
import { dom } from "better-react-dom";
import data from "./data";
import { addEffectDestroy, renderArray, useAtom, useChange, useEffect, useEvent, useHookEffect, useMemo } from "better-react-helper";
import { BGColor, bgColorfromHex, cacheVelocity, emptyArray, extrapolationClamp, getAbsoulteIndex, getInterpolate, getInterpolateColor, getSpringBaseAnimationConfig, hexFromBgColor, mixNumber, readArraySliceCircle, rgbFromBgColor, scrollJudgeDirection, subscribeCenterArray, syncMergeCenter } from "wy-helper";
import Lottie, { AnimationItem } from "lottie-web";
import { PagePoint, animateFrame, dragInit, subscribeDragMove, subscribeMove } from "wy-dom-helper";
/**
 * https://www.youtube.com/watch?v=lcqS8uSpHLI
 */
export default function () {
  const [index, setIndex] = useChange(0)
  const moveX = useMemo(() => animateFrame(0))
  const cacheList = useMemo(() => {
    return readArraySliceCircle(data, index - 1, index + 2)
  }, index)
  const lastPoint = useAtom<PagePoint | undefined>(undefined)
  const velocityX = useMemo(() => cacheVelocity(0))
  renderPage({
    title: "demo1",
    bodyStyle: `
    overflow:hidden;
    justify-content:stretch;
    `,
    bodyAttr: {
      ...(dragInit((e, m) => {
        lastPoint.set(e)
        velocityX.reset(m.timeStamp, e.pageX)
      }))
    }
  }, () => {
    const updateDirection = useEvent((direction: number, velocity = 0) => {
      const width = bg.clientWidth
      if (direction < 0) {
        if (index == 0) {
          return
        }
        setIndex(index - 1)
        moveX.changeTo(width, getSpringBaseAnimationConfig({ initialVelocity: velocity }))
      } else if (direction > 0) {
        if (index == 2) {
          return
        }
        setIndex(index + 1)
        moveX.changeTo(-width, getSpringBaseAnimationConfig({ initialVelocity: velocity }))
      } else {
        moveX.changeTo(0, getSpringBaseAnimationConfig({ initialVelocity: velocity }))
      }
    })

    const shouldChange = useEvent((e: PagePoint, m: Event, lp: PagePoint) => {
      velocityX.append(m.timeStamp, e.pageX)
      const toX = moveX.get() + e.pageX - lp.pageX
      if (index == 0 && toX > 0) {
        return
      }
      if (index == 2 && toX < 0) {
        return
      }
      moveX.changeTo(toX)
    })
    useHookEffect(() => {
      addEffectDestroy(subscribeDragMove((e, m) => {
        const width = bg.clientWidth
        const lp = lastPoint.get()
        if (lp) {
          if (e) {
            shouldChange(e, m, lp)
          } else {
            const dir = scrollJudgeDirection(
              velocityX.get(),
              moveX.get(),
              width
            )
            updateDirection(dir, velocityX.get())
          }
          lastPoint.set(e)
        }
      }))
      addEffectDestroy(syncMergeCenter(moveX, x => {
        container.style.transform = `translateX(${x}px)`
      }))
    }, emptyArray)

    useEffect(() => {
      moveX.slientChange(0)
    }, [index])
    const getIndex = useEvent(() => index)
    useHookEffect(() => {
      const bgC = data.map(row => bgColorfromHex(row.backgroundColor))
      const abg = data.map(row => bgColorfromHex(row.animationBg))
      addEffectDestroy(syncMergeCenter(moveX, d => {
        const width = bg.clientWidth
        const halfWidth = width / 2
        //在0~width之间
        const moveX = ((d + width) % width)
        //0~width/2
        const x = halfWidth - Math.abs(moveX - halfWidth)
        const index = getIndex()
        const vx = d < 0 ? [index, index + 1] : [index - 1, index]
        /**
         * 如果是拖拽,从左到右
         * index:0~1
         * moveX:300~0
         * x:0~150~0
         * d:-0~-150~150~0
         * 如果是点击
         * index:1
         * moveX:300~0
         * x:0~150~0
         * d:300~0
         */
        console.log("xx", moveX)
        bg.style.backgroundColor = rgbFromBgColor(getInterpolateColor({
          0: bgC[getAbsoulteIndex(abg.length, vx[1])],
          [halfWidth - 0.001]: bgC[getAbsoulteIndex(abg.length, vx[1])],
          [halfWidth]: bgC[getAbsoulteIndex(abg.length, vx[0])],
          [width]: bgC[getAbsoulteIndex(abg.length, vx[0])]
        }, extrapolationClamp)(moveX))

        circle.style.backgroundColor = rgbFromBgColor(getInterpolateColor({
          0: abg[getAbsoulteIndex(abg.length, vx[1])],
          10: abg[getAbsoulteIndex(abg.length, vx[0] - 1)],
          [halfWidth - 0.0001]: abg[getAbsoulteIndex(abg.length, vx[0] - 1)],
          [halfWidth]: abg[getAbsoulteIndex(abg.length, vx[0])],
          [width]: abg[getAbsoulteIndex(abg.length, vx[1] - 1)]
        }, extrapolationClamp)(moveX))

        circle.style.transform = `perspective(300px) rotateY(${getInterpolate({
          0: 0,
          [width]: 180
        }, extrapolationClamp)(moveX)}deg) scale(${getInterpolate({
          0: 1,
          [halfWidth]: 8
        }, extrapolationClamp)(x)})`

        button.style.opacity = getInterpolate({
          0: 1,
          40: 0
        }, extrapolationClamp)(x) + ''
      }))
    }, emptyArray)
    const bg = dom.div({
      style: `
      z-index:-9999;
      inset:0;
      position:absolute
      `
    }).render()
    const container = dom.div({
      style: `
      width:300%;
      height:100%;
      display:flex;
      align-items:stretch;
      `
    }).render(() => {

      renderArray(cacheList, v => v.id, (row, i) => {

        useHookEffect(() => {
          addEffectDestroy(syncMergeCenter(moveX, d => {
            const width = bg.clientWidth
            const index = getIndex()
            //在0~width之间
            const diff = - index * width + d
            const i = data.findIndex(v => v.id == row.id)
            const positionMove = diff + i * width
            div.style.transform = `
            scale(${getInterpolate({
              [width]: 0.5,
              0: 1,
              [-width]: 0.5
            }, extrapolationClamp)(positionMove)})
            translateY(${getInterpolate({
              [width]: 100,
              0: 0,
              [-width]: 100
            }, extrapolationClamp)(positionMove)}px)
            `
          }))
        }, emptyArray)
        const div = dom.div({
          style: `
          flex:1;
          display:flex;
          flex-direction:column;
          align-items:center;
          color:${row.textColor};
          transform: perspective(300px);
        `,
        }).render(() => {
          useEffect(() => {
            // const shadow = div.attachShadow({ mode: "closed" });
            // const nv = document.createElement("div")
            // shadow.appendChild(nv)
            let nd: AnimationItem
            row.animation.then(value => {
              nd = Lottie.loadAnimation({
                container: div,
                renderer: "canvas",
                animationData: { ...value }
              })
            })
            return () => {
              nd?.destroy()
            }
          }, emptyArray)
          const div = dom.div({
            style: `
            width:200px;
            height:200px;
            background:${row.animationBg};
            `
          }).render()
          dom.h1({
            style: `
            padding-inline:30px;
            `
          }).renderText`${row.text}`
          dom.div({ style: `flex:1` }).render()
        })
      })
    })
    const currentRow = data.at(index)!
    const circle = dom.div({
      style: `
      width:100px;
      height:100px;
      border-radius:50%;
      position:absolute;
      bottom:100px;
      z-index:-1;
      `
    }).render()
    const button = dom.button({
      style: `
      position:absolute;
      bottom:100px;
      width:100px;
      height:100px;
      display:flex;
      align-items:center;
      justify-content:center;
      border:none;
      border-radius:50%;
      background:transparent;
      color:${currentRow.backgroundColor};
      `,
      onClick() {
        updateDirection(1)
      }
    }).renderHtml`
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 7L15 12L10 17" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      `
  })

}
