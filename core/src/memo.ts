import { HookMemo } from "./stateHolder";
import { draftParentFiber, hookStateHoder, revertParentFiber } from "./cache";


export type MemoEvent<V, D = any> = {
  trigger: D
  isInit: boolean
  beforeTrigger?: never
  beforeValue?: never
} | {
  trigger: D
  isInit: boolean
  beforeTrigger: D
  beforeValue: V
}
/**
 * 通过返回函数,能始终通过函数访问fiber上的最新值
 * @param effect 
 * @param deps 
 * @returns 
 */
export function useBaseMemo<V, D>(
  shouldChange: (a: D, b: D) => any,
  effect: (e: MemoEvent<V, D>) => V,
  deps: D,
): V {
  const holder = hookStateHoder()
  const isInit = holder.firstTime
  if (isInit) {
    const hookMemos = holder.memos || []
    holder.memos = hookMemos
    draftParentFiber()
    const state: HookMemo<V, D> = {
      value: effect({
        isInit,
        trigger: deps
      }),
      deps,
      shouldChange
    }
    revertParentFiber()
    const hook = holder.envModel.createChangeAtom(state)
    hookMemos.push(hook)
    return state.value
  } else {
    const hookMemos = holder.memos
    if (!hookMemos) {
      throw new Error("原组件上不存在memos")
    }
    const index = holder.memoIndex
    const hook = hookMemos[index]
    if (!hook) {
      throw new Error("出现了更多的memo")
    }
    const state = hook.get()
    holder.memoIndex = index + 1
    if (state.shouldChange(state.deps, deps)) {
      //不处理
      draftParentFiber()
      const newState: HookMemo<V, D> = {
        value: effect({
          beforeTrigger: state.deps,
          isInit: false,
          trigger: deps,
          beforeValue: state.value
        }),
        deps,
        shouldChange
      }
      revertParentFiber()

      hook.set(newState)
      return newState.value
    }
    return state.value
  }
}