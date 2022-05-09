import { AskNextTimeWork } from 'better-react'
declare const requestIdleCallback: (fun: (v: any) => void) => void
let workList: (() => void)[]
let onWork = false
//返回第一个
function peek<T>(queue: T[]): T | undefined {
  return queue[0]
}
export const askIdleTimeWork: AskNextTimeWork = (works) => {
  workList = works
  if (!onWork) {
    onWork = true
    requestIdle()
  }
}
function requestIdle() {
  requestIdleCallback(idleCallback => {
    let callback = peek(workList)
    while (callback) {
      if (idleCallback.timeRemaining() > 0) {
        workList.shift()
        callback()
        callback = peek(workList)
      } else {
        requestIdle()
        break
      }
    }
    if (!callback) {
      onWork = false
    }
  })
}