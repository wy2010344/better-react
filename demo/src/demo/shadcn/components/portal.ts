import { dom } from "better-react-dom";
import { useAttrEffect } from "better-react-helper";
import { emptyArray, EmptyFun } from "wy-helper";



export function renderPortalPop(
  trigger: HTMLElement,
  open: any,
  config: {
    //退出时用时
    exitDelay: number

    direction: "x" | "y"

    align: "start" | "center" | "end"
    alignOffset: number

    sideOffset: number
  },
  children: EmptyFun
) {
  useAttrEffect(() => {
    if (open) {
      const rect = trigger.getBoundingClientRect()
      if (config.direction == 'x') {
        if (config.align == 'start') {
          div.style.transform = `translate(${rect.right + config.sideOffset}px, ${rect.top + config.sideOffset}px)`
        }
      } else if (config.direction == 'y') {
        if (config.align == 'start') {
          div.style.transform = `translate(${rect.left + config.alignOffset}px, ${rect.bottom + config.sideOffset}px)`
        }
      }
      document.body.appendChild(div)
    } else {
      if (config.exitDelay > 0) {
        setTimeout(() => {
          div.remove()
        }, config.exitDelay)
      } else {
        div.remove()
      }
    }
  }, [open])
  useAttrEffect(() => {
    return () => {
      div.remove()
    }
  }, emptyArray)
  const div = dom.div({
    className: 'fixed left-0 top-0',
  }, true).render(children)
  return div
}