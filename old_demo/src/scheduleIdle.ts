import { AskNextTimeWork,REAL_WORK } from 'better-react'
declare const requestIdleCallback: (fun: (v: any) => void) => void
let getNextWork:()=>REAL_WORK|void
export const getTime = () => performance.now()
let onWork = false
export const askIdleTimeWork: AskNextTimeWork = (_getNextWork) => {
  getNextWork=_getNextWork
  if (!onWork) {
    onWork = true
    requestIdle()
  }
}
let lastRenderTime=getTime()
function requestIdle() {
  requestIdleCallback(idleCallback => {
    let rendered=false
    let callback = getNextWork()
    while (callback) {
      if (idleCallback.timeRemaining() > 0) {
        callback()
        if(callback.isRender){
          rendered=true
          const thisRenderTime=getTime()
          console.log("render",thisRenderTime-lastRenderTime)
          lastRenderTime=thisRenderTime
        }
        callback =getNextWork()
        if(callback && callback.isRender && rendered){
          console.log("禁止二次render")
          requestIdle()
          break
        }
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