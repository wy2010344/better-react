
import { AskNextTimeWork } from 'better-react'
export const askTimeWork: AskNextTimeWork = (request) => {
  requestIdleCallback(function (idleCallback) {
    request(() => idleCallback.timeRemaining() > 0)
  })
}
