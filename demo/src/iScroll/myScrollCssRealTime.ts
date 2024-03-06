
import { useTimeoutAnimateValue, useEffect, useMemo, useStoreTriggerRender } from "better-react-helper";
import { TimeoutAnimateConfig, buildScroll, emptyArray, momentum, scrollEases, syncMergeCenter } from "wy-helper";
import { renderTemplate } from "./template";
import { getPageOffset } from "wy-dom-helper";
export default function () {
  renderTemplate(function (wrapper, getContainer) {
    const translateY = useTimeoutAnimateValue<number, string>(0)
    const handleDown = useMemo(() => buildScroll({
      wrapperSize() {
        return wrapper.clientHeight
      },
      containerSize() {
        return getContainer().clientHeight
      },
      changeTo(value, config, onFinish) {
        let c: TimeoutAnimateConfig<string> | undefined = undefined
        if (config) {
          if (config.type == 'reset') {
            c = {
              duration: 600,
              value: scrollEases.circular.style
            }
          } else if (config.type == 'smooth') {
            c = {
              duration: config.duration,
              value: scrollEases.circular.style
            }
          } else if (config.type == 'smooth-edge') {
            c = {
              duration: config.duration,
              value: scrollEases.quadratic.style
            }
          }
        }
        translateY.changeTo(value, c, onFinish)
      },
      getCurrentValue() {
        const tg = translateY.get()
        if (tg.config) {
          const diff = getContainer().getBoundingClientRect().top - getPageOffset(getContainer()).y
          console.log("getRealValue", diff)
          return diff
        }
        return tg.value
      },
      momentum: momentum.iScroll()
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
        c.style.transform = `translateY(${value.value}px)`
        if (value.config) {
          c.style.transition = `transform ${value.config.value} ${value.config.duration}ms`
        } else {
          c.style.transition = ''
        }
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