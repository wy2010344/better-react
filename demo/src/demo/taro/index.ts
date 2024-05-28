import { addEffectDestroy, createUseReducer, renderArray, useAtom, useChange, useEffect, useHookEffect, useMemo } from "better-react-helper";
import { renderPage } from "../util/page";
import { AnimationConfig, SpringBaseAnimationConfig, SpringOutValue, TweenAnimationConfig, easeFns, emptyArray, quote, springBase, springIsStop, subscribeCenterArray, syncMergeCenterArray } from "wy-helper";
import { dom } from "better-react-dom";
import { PagePoint, animateFrame, cacheVelocity, dragInit, subscribeDragMove } from "wy-dom-helper";
import { lstat } from "fs";

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

const ease = new SpringBaseAnimationConfig()//new TweenAnimationConfig(600, easeFns.out(easeFns.circ))
export default function () {
  renderPage({
    title: "taro",
    bodyStyle: `
    overflow:hidden;
  background: lightblue;
  cursor: url('https://uploads.codesandbox.io/uploads/user/b3e56831-8b98-4fee-b941-0e27f39883ab/Ad1_-cursor.png') 39 39, auto;
  ` }, () => {
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

      const removed = useAtom(false)
      const lastPoint = useAtom<PagePoint | undefined>(undefined)
      const { velocityX, velocityY, x, y, rot, scale } = useMemo(() => {
        return {
          velocityX: cacheVelocity(),
          velocityY: cacheVelocity(),
          x: animateFrame(0),
          y: animateFrame(-1000),
          rot: animateFrame(0),
          scale: animateFrame(1.5)
        }
      })



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
        addEffectDestroy(subscribeDragMove(function (p, end, e) {
          const lastP = lastPoint.get()
          if (lastP) {
            p = p || lastP
            const vx = velocityX(e.timeStamp, p.pageX)
            const vy = velocityY(e.timeStamp, p.pageY)
            const v = Math.sqrt(vx * vx + vy * vy)
            const dir = vx < 0 ? -1 : 1
            if (v > 1) {
              removed.set(true)
            }
            const gone = removed.get()
            const deltaX = p.pageX - lastP.pageX
            if (gone) {
              //已经移除
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
              if (end) {
                x.changeTo(0, ease)
              } else {
                //跟随鼠标
                x.changeTo(x.get() + p.pageX - lastP.pageX, ease)
              }
              rot.changeTo(deltaX / 100, ease)
            }

            scale.changeTo(end ? 1 : 1.1, ease)

            if (end) {
              lastPoint.set(undefined)
            } else {
              lastPoint.set(p)
            }
          }
        }))
      }, emptyArray)
      const { wrapper, inner } = dom.div({
        style: `
        position:absolute;
        inset:0;
        display:flex;
        align-items:center;
        justify-content:center;
        `,
        ...dragInit((p, e) => {
          lastPoint.set(p)
          velocityX(e.timeStamp, p.pageX)
          velocityY(e.timeStamp, p.pageY)
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