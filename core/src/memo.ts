import { hookStateHoder } from "./cache";


export type HookMemo<T, D> = {
  shouldChange(a: D, b: D): any,
  deps: D
  value: T
}

export type MemoEvent<V, D = any> = {
  trigger: D
  isInit: false
  beforeValue: V
  beforeTrigger: D
} | {
  trigger: D
  isInit: true
  beforeValue?: never
  beforeTrigger?: never
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
  if (holder.firstTime) {
    const hookMemos = holder.memos || []
    holder.memos = hookMemos
    const state: HookMemo<V, D> = {
      value: effect({
        trigger: deps,
        isInit: true
      }),
      deps,
      shouldChange
    }
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
      const newState: HookMemo<V, D> = {
        value: effect({
          trigger: deps,
          isInit: false,
          beforeTrigger: state.deps,
          beforeValue: state.value
        }),
        deps,
        shouldChange
      }
      hook.set(newState)
      return newState.value
    }
    return state.value
  }
}