import { AskNextTimeWork } from 'better-react'

declare const requestIdleCallback: (fun: (v: any) => void) => void
export const askTimeWork: AskNextTimeWork = (request) => {
  requestIdleCallback(function (idleCallback) {
    request(() => idleCallback.timeRemaining() > 0)
  })
}
