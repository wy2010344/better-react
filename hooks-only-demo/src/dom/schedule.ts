import { AskNextTimeWork, REAL_WORK } from "../core"
export const getTime = () => performance.now()
const canPromise = typeof Promise !== 'undefined' && window.queueMicrotask
const canMessageChannel = typeof MessageChannel !== 'undefined'
function runMacroTask(fun: () => void) {
  if (canMessageChannel) {
    /**
     * MessageChannel是一个宏任务,
     * 先于setTimeout,
     * 次于requestAnimationFrame
     */
    const { port1, port2 } = new MessageChannel()
    port1.onmessage = fun
    return port2.postMessage(null)
  }
  return setTimeout(fun)
}
function runMicroTask(fun: () => void) {
  if (canPromise) {
    queueMicrotask(fun)
  }
  return runMacroTask(fun)
}
let getNextWork: () => REAL_WORK | void
let onWork = false
const threshold: number = 5
let lastRenderTime = getTime()
/**
 * 执行queue中的任务
 * 本次没执行完,下次执行.
 * 下次一定需要在宏任务中执行
 */
const flush = () => {
  const deadline = getTime() + threshold
  let rendered = false
  let callback = getNextWork()
  while (callback) {
    if (getTime() < deadline) {
      if (callback.isRender) {
        rendered = true
        const thisRenderTime = getTime()
        if (thisRenderTime - lastRenderTime < 16) {
          //和上次的间隔需要大于16ms
          runMacroTask(flush)
          break
        }
        callback()
        rendered = true
        //console.log("render", thisRenderTime - lastRenderTime)
        lastRenderTime = thisRenderTime
      } else {
        callback()
      }
      callback = getNextWork()
    } else {
      //需要中止,进入宏任务.原列表未处理完
      runMacroTask(flush)
      break
    }
  }
  if (!callback) {
    onWork = false
  }
}
export const ScheduleAskTime: AskNextTimeWork = (_getNextWork) => {
  getNextWork = _getNextWork
  if (!onWork) {
    onWork = true
    runMicroTask(flush)
  }
}