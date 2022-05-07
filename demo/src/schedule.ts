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
export type ITaskCallback = (shouldContinue: () => boolean) => void
const queue: ITaskCallback[] = []
const threshold: number = 5
/**
 * 执行queue中的任务
 * 本次没执行完,下次执行.
 * 下次一定需要在宏任务中执行
 */
const flush = () => {
  const deadline = getTime() + threshold
  const shouldContinue = () => {
    return getTime() < deadline
  }
  let callback = peek(queue)
  while (callback) {
    if (shouldContinue()) {
      callback(shouldContinue)
      queue.shift()
      callback = peek(queue)
    } else {
      //需要中止,进入宏任务.原列表未处理完
      runMacroTask(flush)
      break
    }
  }
}
//批量任务
const schedule = (callback: ITaskCallback): void => {
  queue.push(callback)
  if (queue.length == 1) {
    //原列表已经处理完了,使用微任务进入下一步
    runMicroTask(flush)
  }
}

export const ScheduleAskTime: AskNextTimeWork = (fun) => {
  schedule((shouldContinue) => {
    fun(shouldContinue)
  })
}