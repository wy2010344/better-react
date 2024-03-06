import { } from "better-react-dom-helper";
import { useTimeoutAnimateValue, useEffect, useMemo, useStoreTriggerRender } from "better-react-helper";
import { TimeoutAnimateConfig, buildScroll, emptyArray, momentum, scrollEases } from "wy-helper";
import { renderTemplate } from "./template";
function getTranslateY(element: HTMLElement) {
  let top = 0
  while (element) {
    top += element.offsetTop
    element = element.offsetParent as HTMLElement
  }
  return top
}

export default function () {
  renderTemplate(function (wrapper, getContainer) {
    const translateY = useTimeoutAnimateValue<number, string>(0)
    const transY = useStoreTriggerRender(translateY)
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
          const diff = getContainer().getBoundingClientRect().top - getTranslateY(getContainer())
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
      return `
  transform:translateY(${transY.value}px);
  ${transY.config ? `transition:transform ${transY.config.value} ${transY.config.duration}ms` : ''}
    `
    }
  })
}