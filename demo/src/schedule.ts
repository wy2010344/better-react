import { AskNextTimeWork } from "better-react"
export const getTime = () => performance.now()
//返回第一个
function peek<T>(queue: T[]): T | undefined {
  return queue[0]
}
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
let workList: (() => void)[]
let onWork = false
const threshold: number = 5
/**
 * 执行queue中的任务
 * 本次没执行完,下次执行.
 * 下次一定需要在宏任务中执行
 */
const flush = () => {
  const deadline = getTime() + threshold
  let callback = peek(workList)
  while (callback) {
    if (getTime() < deadline) {
      workList.shift()
      callback()
      callback = peek(workList)
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
export const ScheduleAskTime: AskNextTimeWork = (works) => {
  workList = works
  if (!onWork) {
    onWork = true
    runMicroTask(flush)
  }
}