import { AskNextTimeWork } from "better-react"
import { EmptyFun, emptyObject } from "wy-helper"
export const getTime = () => performance.now()
const canPromise = typeof Promise !== 'undefined' && window.queueMicrotask
const canMessageChannel = typeof MessageChannel !== 'undefined'
function runMacroTask(fun: EmptyFun) {
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
function runMicroTask(fun: EmptyFun) {
  if (canPromise) {
    queueMicrotask(fun)
  }
  return runMacroTask(fun)
}

let startSyncTask = false
const syncTasks: EmptyFun[] = []
function runTaskSync(fun: EmptyFun) {
  syncTasks.push(fun)
  if (!startSyncTask) {
    startSyncTask = true
    let task = syncTasks.pop()
    while (task) {
      task()
      task = syncTasks.pop()
    }
    startSyncTask = false
  }
}

function runTask(fun: EmptyFun) {
  runMacroTask(fun)
}

/**
 * 提前执行掉一些工作,却可能回滚
 * @param param0 
 * @returns 
 */
export function getScheduleAskTime({
  taskTimeThreadhold = 5
}: {
  taskTimeThreadhold?: number
} = emptyObject): AskNextTimeWork {
  return function ({
    askNextWork,
    realTime
  }) {
    let onWork = false
    /**
     * 执行queue中的任务
     * 本次没执行完,下次执行.
     * 下次一定需要在宏任务中执行
     */
    const flush = () => {
      const deadline = getTime() + taskTimeThreadhold
      let callback = askNextWork()
      while (callback) {
        if (realTime.get()) {
          callback()
          callback = askNextWork()
        } else {
          if (callback.isRender) {
            //延时检查
            setTimeout(flush, deadline - getTime())
            break
          }
          if (getTime() < deadline) {
            callback()
            callback = askNextWork()
          } else {
            //需要中止,进入宏任务.原列表未处理完
            runTask(flush)
            break
          }
        }
      }
      if (!callback) {
        onWork = false
      }
    }

    //render期间必须执行完成
    function requestAnimationFrameCheck() {
      if (onWork) {
        let work = askNextWork()
        while (work) {
          work()
          if (work.isRender && !realTime.get()) {
            if (askNextWork()) {
              beginAsyncWork()
            } else {
              onWork = false
            }
            break
          }
          work = askNextWork()
        }
      }
    }

    function beginAsyncWork() {
      runTask(flush)
      requestAnimationFrame(requestAnimationFrameCheck)
    }
    return function () {
      if (!onWork) {
        onWork = true
        if (realTime.get()) {
          runTaskSync(flush)
        } else {
          beginAsyncWork()
        }
      }
    }
  }
}

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
          if (work.isRender && !realTime.get()) {
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