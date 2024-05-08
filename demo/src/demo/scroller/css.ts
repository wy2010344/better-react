
import { useTimeoutAnimateValue, useEffect, useMemo, useStoreTriggerRender } from "better-react-helper";
import { TimeoutAnimateConfig, buildScroll, emptyArray, momentum, scrollEases, syncMergeCenter } from "wy-helper";
import { renderTemplate } from "./template";
import { getPageOffset, subscribeMove } from "wy-dom-helper";
export default function () {
  renderTemplate(function (wrapper, container) {
    const translateY = useTimeoutAnimateValue<number, string>(0)
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
      const dm = subscribeMove(function (e, end) {
        if (end) {
          handleDown.end(e.pageY)
        } else {
          handleDown.move(e.pageY)
        }
      })
      const c = container
      const di = syncMergeCenter(translateY, function (value) {
        c.style.transform = `translateY(${value.value}px)`
        if (value.config) {
          c.style.transition = `transform ${value.config.value} ${value.config.duration}ms`
        } else {
          c.style.transition = ''
        }
      })
      return function () {
        dm()
        di()
      }
    }, emptyArray)

    return function () {
      return {
        onPointerDown(e) {
          handleDown.start(e.pageY)

        },
      }
    }
  })
}