import { EmptyFun, alawaysTrue } from 'wy-helper'
import { hookEnvModel, hookStateHoder } from './cache'
import { IEnvModel } from './commitWork'
export type ReconcileFun = (fun: (env: IEnvModel) => any) => void
export function hookRequestReconcile(): ReconcileFun {
  const holder = hookStateHoder()
  const appState = hookEnvModel().appState
  const parentFiber = holder.fiber
  if (!parentFiber.requestReconcile) {
    parentFiber.requestReconcile = function (callback) {
      if (holder.destroyed) {
        console.log('更新已经销毁的fiber')
        return
      }
      appState.reconcile(function (env) {
        if (callback(env)) {
          if (holder.destroyed) {
            console.log('更新已经销毁的fiber,1')
            return
          }
          parentFiber.effectTag.set(env, 'UPDATE')
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
