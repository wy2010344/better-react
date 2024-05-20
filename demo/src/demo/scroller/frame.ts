import { AnimationConfig, emptyArray, scrollEases, syncMergeCenter } from "wy-helper";
import { renderTemplate } from "./template";
import { addEffectDestroy, useAnimateValue, useEffect, useHookEffect, useMemo } from "better-react-helper";
import { buildScroll, momentum, } from 'wy-helper'
import { animateFrame, subscribeMove } from "wy-dom-helper";

export default function () {
  renderTemplate("frame", function (wrapper, container) {
    const translateY = useMemo(() => animateFrame(0))
    const handleDown = useMemo(() => buildScroll({
      wrapperSize() {
        return wrapper.clientHeight
      },
      containerSize() {
        return container.clientHeight
      },
      changeTo(value, config, onFinish) {
        let c: AnimationConfig | undefined = undefined
        if (config) {
          if (config.type == 'reset') {
            c = {
              duration: 600,
              fn: scrollEases.circular.fn
            }
          } else if (config.type == 'smooth') {
            c = {
              duration: config.duration,
              fn: scrollEases.circular.fn
            }
          } else if (config.type == 'smooth-edge') {
            c = {
              duration: config.duration,
              fn: scrollEases.quadratic.fn
            }
          }
        }
        translateY.changeTo(value, c, {
          onFinish
        })
      },
      getCurrentValue() {
        return translateY.get()
      },
      momentum: momentum.iScroll()
    }), emptyArray)

    useHookEffect(() => {
      const c = container
      addEffectDestroy(subscribeMove(function (e, end) {
        if (end) {
          handleDown.end(e.pageY)
        } else {
          handleDown.move(e.pageY)
        }
      }))
      addEffectDestroy(syncMergeCenter(translateY, function (value) {
        c.style.transform = `translateY(${value}px)`
      }))
    }, emptyArray)

    return function () {
      return {
        onPointerDown(e) {
          handleDown.start(e.pageY)
        }
      }
    }
  })
}