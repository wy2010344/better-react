import { DammpingFactory, FrictionalFactory, cacheVelocity, easeFns, emptyArray, getTweenAnimationConfig, syncMergeCenter } from "wy-helper";
import { renderTemplate } from "./template";
import { addEffectDestroy, useAtom, useHookEffect, useMemo } from "better-react-helper";
import { buildScroll, MomentumIScroll, } from 'wy-helper'
import { animateFrame, dragInit, subscribeDragMove } from "wy-dom-helper";

export default function () {
  renderTemplate("frame", function (wrapper, container) {
    const translateY = useMemo(() => animateFrame(0))
    const men = new DammpingFactory(1)
    const men1 = new DammpingFactory(0.1)

    const bs = MomentumIScroll.get()

    const ffc = new FrictionalFactory(0.001)
    const ffc1 = new FrictionalFactory(0.03)
    const handleDown = useMemo(() => buildScroll({
      wrapperSize() {
        return wrapper.clientHeight
      },
      containerSize() {
        return container.clientHeight
      },
      changeTo(value) {
        translateY.changeTo(value)
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
        // translateY.changeTo(n, fn)
      },
      // changeTo(value, config, onFinish) {
      //   let c: AnimationConfig | undefined = undefined
      //   if (config) {
      //     if (config.type == 'reset') {
      //       c = getTweenAnimationConfig(600, scrollEases.circular.fn)
      //     } else if (config.type == 'smooth') {
      //       c = getTweenAnimationConfig(config.duration, scrollEases.circular.fn)
      //     } else if (config.type == 'smooth-edge') {
      //       c = getTweenAnimationConfig(config.duration, scrollEases.quadratic.fn)
      //     }
      //   }
      //   translateY.changeTo(value, c, {
      //     onFinish
      //   })
      // },
      getCurrentValue() {
        return translateY.get()
      },
      // finish(v) {
      //   // v.velocity = v.velocity < 0 ? Math.max(v.velocity, -3) : Math.min(v.velocity, 3)
      //   const o = men.momentumJudge(v)
      //   const mf = men.getFromVelocity(v.velocity * 1000)
      //   console.log("vsvs", o)
      //   if (o.type == 'scroll') {
      //     translateY.changeTo(o.target, new DampingAnimationConfig(mf))
      //   } else if (o.type == 'scroll-edge') {
      //     const endTime = mf.getTimeToDistance((o.target - o.from))
      //     const xm = mf.getVelocity(endTime)
      //     const mf1 = men1.getFromVelocity(xm)
      //     console.log("vss", xm, endTime, mf1.duration, mf1.maxDistance)
      //     translateY.changeTo(o.target,
      //       new DampingAnimationConfig(mf, endTime), {
      //       onFinish(v) {
      //         // console.log("end", translateY.get(), endTime, mf.duration)
      //         if (v) {
      //           translateY.changeTo(o.target + mf1.maxDistance, new DampingAnimationConfig(mf1), {
      //             onFinish(v) {
      //               if (v) {
      //                 translateY.changeTo(o.target, new SpringBaseAnimationConfig({ zta: 1 }), {
      //                   onFinish(v) {
      //                     if (v) {
      //                       console.log("spring-end")
      //                     }
      //                   },
      //                 })
      //               }
      //             },
      //           })
      //         }
      //       },
      //     })
      //   } else if (o.type == 'edge-back') {
      //     translateY.changeTo(o.target, new SpringBaseAnimationConfig({ zta: 0.5 }))
      //   }
      // },
      // finish(v) {
      //   const [value, fn] = bs(v)
      //   translateY.changeTo(value, fn, {
      //     onFinish(v) {
      //       console.log("finish", v)
      //     },
      //   })
      // },
      // finish(v) {
      //   const o = ffc.momentumJudge(v)
      //   console.log("vs", o)
      //   const mf = ffc.getFromVelocity(v.velocity)
      //   if (o.type == 'scroll') {
      //     translateY.changeTo(o.target, new FrictionalAnimationConfig(mf))
      //   } else if (o.type == 'scroll-edge') {
      //     const endTime = mf.getTimeToDistance(o.target - o.from)
      //     //惯性移动到边界
      //     translateY.changeTo(o.target, new FrictionalAnimationConfig(mf, endTime), {
      //       onFinish(v) {
      //         if (v) {
      //           //正常结束
      //           const v = mf.getVelocity(endTime)
      //           const mf1 = ffc1.getFromVelocity(v)
      //           //惯性向外移动
      //           translateY.changeTo(o.target + mf1.maxDistance, new FrictionalAnimationConfig(mf1), {
      //             onFinish(v) {
      //               if (v) {
      //                 //只有位移,时间需要变化,使用弹簧
      //                 translateY.changeTo(o.target, new SpringBaseAnimationConfig({ zta: 0.3 }))
      //               }
      //             },
      //           })
      //         }
      //       },
      //     })
      //   } else if (o.type == 'edge-back') {
      //     translateY.changeTo(o.target, new SpringBaseAnimationConfig({ zta: 0.3 }))
      //   }
      // },
      // momentum: momentum.bScroll({
      //   getOnDragEnd(duration, edge) {
      //     console.log("dvs", duration, edge)
      //     if (edge) {
      //       return getTweenAnimationConfig(duration, scrollEases.quadratic.fn)
      //     } else {
      //       return getTweenAnimationConfig(duration, scrollEases.circular.fn)
      //     }
      //   },
      //   onEdgeBack: getTweenAnimationConfig(600, scrollEases.circular.fn)
      // })
      // momentum: momentum.iScroll({
      //   getOnDragEnd(duration, edge) {
      //     if (edge) {
      //       return getTweenAnimationConfig(duration, scrollEases.quadratic.fn)
      //     } else {
      //       return getTweenAnimationConfig(duration, scrollEases.circular.fn)
      //     }
      //   },
      //   onEdgeBack: getTweenAnimationConfig(600, scrollEases.circular.fn)
      // })
    }), emptyArray)

    const velocity = useMemo(() => cacheVelocity(32))
    const isDrag = useAtom(false)
    useHookEffect(() => {
      const c = container
      addEffectDestroy(subscribeDragMove(function (p, e) {
        if (isDrag.get() && p) {
          velocity.append(e.timeStamp, p.pageY)
        }
        if (p) {
          handleDown.move(p.pageY)
        } else {
          handleDown.end()
          isDrag.set(false)
        }
      }))
      addEffectDestroy(syncMergeCenter(translateY, function (value) {
        c.style.transform = `translateY(${value}px)`
      }))
    }, emptyArray)

    return function () {
      return {
        ...(dragInit((p, e) => {
          handleDown.start(p.pageY)
          velocity.reset(e.timeStamp, p.pageY)
          isDrag.set(true)
        }))
      }
    }
  })
}

