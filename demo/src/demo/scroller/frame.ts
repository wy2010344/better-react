import { DammpingFactory, FrictionalFactory, cacheVelocity, easeFns, emptyArray, getTweenAnimationConfig, startScroll, syncMergeCenter } from "wy-helper";
import { renderTemplate } from "./template";
import { addEffectDestroy, useAtom, useHookEffect, useMemo } from "better-react-helper";
import { MomentumIScroll, } from 'wy-helper'
import { animateFrame, dragInit, subscribeDragMove, subscribeEventListener } from "wy-dom-helper";

export default function () {
  renderTemplate("frame", function (wrapper, container) {
    const translateY = useMemo(() => animateFrame(0), emptyArray)
    useHookEffect(() => {
      const c = container
      addEffectDestroy(syncMergeCenter(translateY, function (value) {
        console.log("ddd", value)
        c.style.transform = `translateY(${value}px)`
      }))
    }, emptyArray)

    return function () {
      return {
        ...(dragInit((p, e) => {
          const bs = MomentumIScroll.get()
          // const men = new DammpingFactory(1)
          // const men1 = new DammpingFactory(0.1)
          // const ffc = new FrictionalFactory(0.001)
          // const ffc1 = new FrictionalFactory(0.03)
          const velocity = cacheVelocity(32)
          const m = startScroll(p.pageY, {
            containerSize() {
              return wrapper.clientHeight
            },
            contentSize() {
              return container.offsetHeight
            },
            changeTo(value) {
              translateY.changeTo(value)
              console.log("change", value, translateY.get())
            },
            getCurrentValue() {
              return translateY.get()
            },
            finish(v) {
              const out = bs.destinationWithMargin(v)
              if (out.type == "scroll") {
                translateY.changeTo(out.target, getTweenAnimationConfig(out.duration, easeFns.out(easeFns.circ)))
              } else if (out.type == "scroll-edge") {
                translateY.changeTo(out.target, getTweenAnimationConfig(out.duration, easeFns.out(easeFns.circ)), {
                  onFinish(v) {
                    translateY.changeTo(out.finalPosition, getTweenAnimationConfig(300, easeFns.out(easeFns.circ)))
                  },
                })

              } else if (out.type == "edge-back") {
                translateY.changeTo(out.target, getTweenAnimationConfig(300, easeFns.out(easeFns.circ)), {
                  onProcess(v) {
                    console.log("vss", v)
                  },
                  onFinish(v) {
                    console.log("va", translateY.get())
                  },
                })
              }
            },
          })


          const destroyMove = subscribeEventListener(document, 'pointermove', e => {
            velocity.append(e.timeStamp, p.pageY)
            m.move(e.pageY)
          })
          const destroyUp = subscribeEventListener(document, 'pointerup', e => {
            m.end()
            destroyMove()
            destroyUp()
          })

          velocity.reset(e.timeStamp, p.pageY)
        })),
        style: {}
      }
    }
  })
}

