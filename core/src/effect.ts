
import { EmptyFun } from "wy-helper";
import { hookAddEffect, hookParentFiber, hookStateHoder } from "./cache";

export type HookEffect<V, D> = {
  level: number,
  shouldChange(a: D, b: D): any
  deps: D
  value?: V
  isInit: boolean
  destroy?: void | ((newDeps: EffectDestroyEvent<V, D>) => void)
}

export type LayoutEffect = (fun: EmptyFun) => void

export type EffectDestroyEvent<V, T> = {
  isDestroy: false
  trigger: T
  value: V,
  beforeIsInit: boolean,
  beforeTrigger: T
  setRealTime(): void
} | {
  isDestroy: true
  trigger?: never
  value: V,
  beforeIsInit: boolean,
  beforeTrigger: T
  setRealTime(): void
}
export type EffectDestroy<V, T> = (void | ((e: EffectDestroyEvent<V, T>) => void))
export type EffectResult<V, T> = [V, EffectDestroy<V, T>] | void
export type EffectEvent<V, T> = {
  trigger: T
  isInit: true
  value?: never
  beforeTrigger?: never
  setRealTime(): void
} | {
  trigger: T
  isInit: false
  value: V,
  beforeTrigger: T
  setRealTime(): void
}

/**
 * 必须有个依赖项,如果没有依赖项,如果组件有useFragment,则会不执行,造成不一致.
 * useMemo如果无依赖,则不需要使用useMemo,但useEffect没有依赖,仍然有意义.有依赖符合幂等,无依赖不需要幂等.
 * @param effect 
 * @param deps 
 */
export function useLevelEffect<V, T>(
  level: number,
  /**可以像memo一样放在外面..*/
  shouldChange: (a: T, b: T) => any,
  effect: (e: EffectEvent<V, T>) => EffectResult<V, T>, deps: T): void {
  const holder = hookStateHoder()
  if (holder.firstTime) {
    //新增
    const hookEffects = holder.effects || []
    holder.effects = hookEffects
    const state: HookEffect<V, T> = {
      level,
      deps,
      isInit: true,
      shouldChange
    }
    const hookEffect = holder.envModel.createChangeAtom(state)
    hookEffects.push(hookEffect)
    holder.envModel.updateEffect(level, () => {
      hookAddEffect(holder.envModel.layoutEffect)
      const out = effect({
        beforeTrigger: undefined,
        isInit: true,
        trigger: deps,
        setRealTime: holder.envModel.setRealTime
      })
      hookAddEffect(undefined)
      if (out) {
        [state.value, state.destroy] = out
      }
    })
  } else {
    const hookEffects = holder.effects
    if (!hookEffects) {
      throw new Error("原组件上不存在hookEffects")
    }
    const index = holder.effectIndex
    const hookEffect = hookEffects[index]
    if (!hookEffect) {
      throw new Error("出现了更多的effect")
    }
    const state = hookEffect.get()
    holder.effectIndex = index + 1
    if (state.shouldChange(state.deps, deps)) {
      const newState: HookEffect<V, T> = {
        level,
        deps,
        isInit: false,
        shouldChange
      }
      hookEffect.set(newState)
      holder.envModel.updateEffect(level, () => {
        if (state.destroy) {
          hookAddEffect(holder.envModel.layoutEffect)
          state.destroy({
            isDestroy: false,
            trigger: deps,
            value: state.value,
            beforeIsInit: state.isInit,
            beforeTrigger: state.deps,
            setRealTime: holder.envModel.setRealTime
          })
          hookAddEffect(undefined)
        }
        hookAddEffect(holder.envModel.layoutEffect)
        const out = effect({
          beforeTrigger: state.deps,
          isInit: false,
          value: state.value,
          trigger: deps,
          setRealTime: holder.envModel.setRealTime
        })
        hookAddEffect(undefined)
        if (out) {
          [newState.value, newState.destroy] = out
        }
      })
    }
  }
}


export function hookLevelEffect(
  level: number,
  effect: EmptyFun
) {
  const parentFiber = hookParentFiber()
  parentFiber.envModel.updateEffect(level, effect)
}