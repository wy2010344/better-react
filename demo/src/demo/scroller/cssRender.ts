
import { useTimeoutAnimateValue, useEffect, useMemo, useStoreTriggerRender } from "better-react-helper";
import { TimeoutAnimateConfig, buildScroll, emptyArray, momentum, scrollEases, syncMergeCenter } from "wy-helper";
import { renderTemplate } from "./template";
import { getPageOffset, subscribeMove } from "wy-dom-helper";
export default function () {
  renderTemplate(function (wrapper, container) {
    const translateY = useTimeoutAnimateValue<number, string>(0)
    const transY = useStoreTriggerRender(translateY)
    const handleDown = useMemo(() => buildScroll({
      wrapperSize() {
        return wrapper.clientHeight
      },
      containerSize() {
        return container.clientHeight
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
          const diff = container.getBoundingClientRect().top - getPageOffset(container).y
          console.log("getRealValue", diff)
          return diff
        }
        return tg.value
      },
      momentum: momentum.iScroll()
    }), emptyArray)

    useEffect(() => {
      function down(e: PointerEvent) {
        handleDown.start(e.pageY)
      }
      const c = container
      c.addEventListener("pointerdown", down)
      const dc = subscribeMove(function (e, end) {
        if (end) {
          handleDown.end(e.pageY)
        } else {
          handleDown.move(e.pageY)
        }
      })
      return function () {
        c.removeEventListener("pointerdown", down)
        dc()
      }
    }, emptyArray)

    return function () {
      return {
        style: `
  transform:translateY(${transY.value}px);
  ${transY.config ? `transition:transform ${transY.config.value} ${transY.config.duration}ms` : ''}
    `
      }
    }
  })
}