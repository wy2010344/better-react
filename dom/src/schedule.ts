
import { AskNextTimeWork } from "wy-helper"

/**
 * 尽可能延时到requestAnimationFrame执行,反倒是容错更高?
 * @param param0 
 * @returns 
 */
export const requestAnimationFrameScheduler: AskNextTimeWork = ({
  askNextWork,
  realTime
}) => {
  let onWork = false
  function foreverRun() {
    requestAnimationFrame(function () {
      if (onWork) {
        let work = askNextWork()
        while (work) {
          work()
          if (work.lastJob && !realTime.get()) {
            if (!askNextWork()) {
              onWork = false
            }
            break
          }
          work = askNextWork()
        }
      }
      foreverRun()
    })
  }
  foreverRun()
  return function () {
    onWork = true
  }
}