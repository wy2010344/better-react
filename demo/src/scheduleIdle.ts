import { AskNextTimeWork } from 'better-react'
declare const requestIdleCallback: (fun: (v: any) => void) => void
const queue: ((shouldContinue: () => boolean) => void)[] = []
//返回第一个
function peek<T>(queue: T[]): T | undefined {
  return queue[0]
}
export const askIdleTimeWork: AskNextTimeWork = (request) => {
  queue.push(request)
  if (queue.length == 1) {
    requestIdle()
  }
}
function requestIdle() {
  requestIdleCallback(idleCallback => {
    const shouldContinue = () => idleCallback.timeRemaining() > 0
    let callback = peek(queue)
    while (callback) {
      if (shouldContinue()) {
        callback(shouldContinue)
        queue.shift()
        callback = peek(queue)
      } else {
        requestIdle()
        break
      }
    }
  })
}