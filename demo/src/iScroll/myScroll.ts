import { useAnimationNumber } from "better-react-helper";
import { AnimationConfig, buildScroll, emptyArray, momentum, scrollEases } from "wy-helper";
import { renderTemplate } from "./template";
import { useEffect, useMemo } from "better-react-helper";


export default function () {
  renderTemplate(function (wrapper, getContainer) {
    const translateY = useAnimationNumber(0)
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
        return translateY.getValue()
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
      getContainer().addEventListener("pointerdown", down)
      window.addEventListener("pointermove", move)
      window.addEventListener("pointerup", up)
      window.addEventListener("pointercancel", up)
      return function () {
        getContainer().removeEventListener("pointerdown", down)
        window.removeEventListener("pointermove", move)
        window.removeEventListener("pointerup", up)
        window.removeEventListener("pointercancel", up)
      }
    }, emptyArray)
    return function () {
      const transY = translateY.checkValue()
      return `
  transform:translateY(${transY}px);
`
    }
  })
}