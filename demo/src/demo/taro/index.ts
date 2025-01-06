import { addEffectDestroy, createUseReducer, renderArray, useAtom, useEffect, useHookEffect, useMemo } from "better-react-helper";
import { renderPage } from "../util/page";
import { cacheVelocity, emptyArray, emptyObject, getSpringBaseAnimationConfig, quote, syncMergeCenterArray } from "wy-helper";
import { dom } from "better-react-dom";
import { PagePoint, animateFrame, dragInit, subscribeDragMove } from "wy-dom-helper";
import renderViewVelocity, { useLineList } from "./viewVelocity";
import { DragGesture } from "@use-gesture/vanilla";

/**
 * https://www.youtube.com/watch?v=xPbRsca_l7c&t=1196s
 * https://codesandbox.io/embed/j0y0vpz59
 */
//https://upload.wikimedia.org/wikipedia/commons/f/f5/RWS_Tarot_08_Strength.jpg
const cards = [
  'https://upload.wikimedia.org/wikipedia/commons/f/f5/RWS_Tarot_08_Strength.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/5/53/RWS_Tarot_16_Tower.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/9/9b/RWS_Tarot_07_Chariot.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/8/88/RWS_Tarot_02_High_Priestess.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/d/de/RWS_Tarot_01_Magician.jpg'
]

const useCard = createUseReducer(function (old: string[], act: {
  type: "remove"
  value: string
} | {
  type: "reset"
  list: string[]
}) {
  if (act.type == "remove") {
    return old.filter(x => x != act.value)
  } else if (act.type == "reset") {
    return act.list
  }
  return old
})

const ease = getSpringBaseAnimationConfig()//getTweenAnimationConfig(600, easeFns.out(easeFns.circ))

/**
 * 不太好,应该做成速度或偏移的监听,便像动画一样,从0到1,然后动画结束时,
 */
export default function () {
  const [data, setVelocity] = useLineList(emptyObject)
  renderPage({
    title: "taro",
    bodyStyle: `
    overflow:hidden;
  background: lightblue;
  cursor: url('https://uploads.codesandbox.io/uploads/user/b3e56831-8b98-4fee-b941-0e27f39883ab/Ad1_-cursor.png') 39 39, auto;
  `, renderRight() {
      renderViewVelocity(data, "展示速度")
    }
  }, () => {
    const [list, dispatch] = useCard(cards)



    useEffect(() => {
      if (list.length == 0) {
        dispatch({
          type: "reset",
          list: cards
        })
      }
    }, [list])
    renderArray(list, quote, function (row, i) {
      const { x, y, rot, scale } = useMemo(() => {
        return {
          x: animateFrame(0),
          y: animateFrame(-1000),
          rot: animateFrame(0),
          scale: animateFrame(1.5)
        }
      }, emptyArray)
      useHookEffect(() => {
        setTimeout(() => {
          y.changeTo(i * 4, ease)
          scale.changeTo(1, ease)
          rot.changeTo(-10 + Math.random() * 20)
        }, i * 100)
        addEffectDestroy(syncMergeCenterArray([x, y, rot, scale], function ([x, y, r, s]) {
          wrapper.style.transform = `translate3d(${x}px,${y}px,0)`
          inner.style.transform = `perspective(1500px) rotateX(30deg) rotateY(${r / 10}deg) rotateZ(${r}deg) scale(${s})`
        }))
      }, emptyArray)
      // useEffect(() => {
      //   const gesture = new DragGesture(wrapper, ({ velocity, timeStamp }) => {
      //     if (!lastPoint.get()) {
      //       return
      //     }
      //     const vx = velocity[0]
      //     const vy = velocity[1]
      //     const v = Math.sqrt(vx * vx + vy * vy)
      //     setVelocity({
      //       type: "append",
      //       key: "red",
      //       value: {
      //         x: timeStamp,
      //         y: v
      //       }
      //     })

      //   })
      //   return () => {
      //     gesture.destroy()
      //   }
      // }, emptyArray)
      const { wrapper, inner } = dom.div({
        style: `
        position:absolute;
        inset:0;
        display:flex;
        align-items:center;
        justify-content:center;
        `,
        ...dragInit((p, e) => {
          setVelocity({ type: "clear" })
          let lastPoint = p

          const velocityX = cacheVelocity()
          const velocityY = cacheVelocity()
          velocityX.reset(e.timeStamp, p.pageX)
          velocityY.reset(e.timeStamp, p.pageY)

          const destroy = subscribeDragMove(function (p, e) {
            const lastP = lastPoint

            if (p) {
              velocityX.append(e.timeStamp, p.pageX)
              velocityY.append(e.timeStamp, p.pageY)
            }
            const vx = velocityX.get()
            const vy = velocityY.get()
            const v = Math.sqrt(vx * vx + vy * vy)

            setVelocity({
              type: "append",
              key: "green",
              value: {
                x: e.timeStamp,
                y: v
              }
            })
            // setVelocity({
            //   type: "append",
            //   key: "green",
            //   value: {
            //     x: e.timeStamp,
            //     y: Math.sqrt(p.pageX * p.pageX + p.pageY * p.pageY)
            //   }
            // })
            const dir = vx < 0 ? -1 : 1
            const deltaX = p ? p.pageX - lastP.pageX : 0
            if (p) {
              //跟随鼠标
              x.changeTo(x.get() + deltaX)
              rot.changeTo(deltaX / 100)
              scale.changeTo(1.1)
            } else {
              if (v > 0.2) {
                //移除
                x.changeTo((200 + wrapper.clientWidth) * dir, ease, {
                  onFinish(v) {
                    dispatch({
                      type: "remove",
                      value: row
                    })
                  },
                })
                rot.changeTo(deltaX / 100 + dir * 10 * v, ease)
              } else {
                //恢复
                x.changeTo(0, ease)
                rot.changeTo(deltaX / 100, ease)
              }
              scale.changeTo(1, ease)
            }
            if (p) {
              lastPoint = p
            } else {
              destroy()
            }
          })
        })
      }).renderOut((wrapper) => {
        const inner = dom.div({
          style: `
          background-color: white;
    background-size: auto 85%;
    background-repeat: no-repeat;
    background-position: center center;
    width: 45vh;
    max-width: 300px;
    height: 85vh;
    max-height: 570px;
    will-change: transform;
    border-radius: 10px;
    box-shadow: 0 12.5px 100px -10px rgba(50, 50, 73, 0.4), 0 10px 10px -10px rgba(50, 50, 73, 0.3);
    transform: perspective(1500px) rotateX(30deg) rotateY(1.59012deg) rotateZ(15.9012deg) scale(1);
    background-image: url(${row})
          `
        }).render()
        return {
          wrapper,
          inner
        }
      })
    })
  })
}