import { AnimationConfig, buildScroll, emptyArray, momentum, scrollEases, syncMergeCenter } from "wy-helper";
import { renderTemplate } from "./template";
import { useEffect, useMemo } from "better-react-helper";
import { useAnimationFrameNumber } from "better-react-dom-helper";


export default function () {
  renderTemplate(function (wrapper, getContainer) {
    const translateY = useAnimationFrameNumber(0)
    const handleDown = useMemo(() => buildScroll({
      wrapperSize() {
        return wrapper.clientHeight
      },
      containerSize() {
        return getContainer().clientHeight
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
        translateY.changeTo(value, c, onFinish)
      },
      getCurrentValue() {
        return translateY.get()
      },
      momentum: momentum.bScroll()
    }), emptyArray)

    useEffect(() => {
      function move(e: PointerEvent) {
        handleDown.move(e.pageY)
      }
      function down(e: PointerEvent) {
        handleDown.start(e.pageY)
      }
      function up(e: PointerEvent) {
        handleDown.end(e.pageY)
      }
      const c = getContainer()
      c.addEventListener("pointerdown", down)
      window.addEventListener("pointermove", move)
      window.addEventListener("pointerup", up)
      window.addEventListener("pointercancel", up)

      const di = syncMergeCenter(translateY, function (value) {
        c.style.transform = `translateY(${value}px)`
      })
      return function () {
        c.removeEventListener("pointerdown", down)
        window.removeEventListener("pointermove", move)
        window.removeEventListener("pointerup", up)
        window.removeEventListener("pointercancel", up)
        di()
      }
    }, emptyArray)
    return function () {
      return ``
    }
  })
}