import { AskNextTimeWork, EmptyFun, REAL_WORK } from "better-react"
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

function runTask(fun: EmptyFun, realTime: boolean) {
  if (realTime) {
    runTaskSync(fun)
  } else {
    runMacroTask(fun)
  }
}

export function getScheduleAskTime({
  taskTimeThreadhold = 5,
  renderTimeThreadhold = 16
}: {
  taskTimeThreadhold?: number
  renderTimeThreadhold?: number
}): AskNextTimeWork {
  return function ({
    askNextWork,
    realTime
  }) {
    let onWork = false
    let lastRenderTime = getTime()
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
          if (getTime() < deadline) {
            if (callback.isRender) {
              const thisRenderTime = getTime()
              if (thisRenderTime - lastRenderTime < renderTimeThreadhold) {
                //和上次的间隔需要大于16ms,因为刷新频率,放到下一次去执行
                runTask(flush, realTime.get())
                break
              }
              callback()
              //console.log("render", thisRenderTime - lastRenderTime)
              lastRenderTime = thisRenderTime
            } else {
              callback()
            }
            callback = askNextWork()
          } else {
            //需要中止,进入宏任务.原列表未处理完
            runTask(flush, realTime.get())
            break
          }
        }
      }
      if (!callback) {
        onWork = false
      }
    }
    return function () {
      if (!onWork) {
        onWork = true
        runTask(flush, realTime.get())
      }
    }
  }
}