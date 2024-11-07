import { EmptyFun, alawaysTrue } from "wy-helper"
import { hookStateHoder } from "./cache"
export type ReconcileFun = (fun: (updateEffect: (level: number, set: EmptyFun) => void) => any) => void
export function hookRequestReconcile(): ReconcileFun {
  const holder = hookStateHoder()
  const parentFiber = holder.fiber
  if (!parentFiber.requestReconcile) {
    parentFiber.requestReconcile = function (callback) {
      if (holder.destroyed) {
        console.log("更新已经销毁的fiber")
        return
      }
      parentFiber.envModel.reconcile(function () {
        if (callback(parentFiber.envModel.updateEffect)) {
          if (holder.destroyed) {
            console.log("更新已经销毁的fiber,1")
            return
          }
          parentFiber.effectTag.set("UPDATE")
        }
      })
    }
  }
  return parentFiber.requestReconcile
}

export function hookMakeDirtyAndRequestUpdate() {
  const parentFiber = hookStateHoder().fiber
  if (!parentFiber.makeDirtyAndRequestUpdate) {
    const requestReconcile = hookRequestReconcile()
    parentFiber.makeDirtyAndRequestUpdate = function () {
      requestReconcile(alawaysTrue)
    }
  }
  return parentFiber.makeDirtyAndRequestUpdate
}