import { Fiber, FiberEvent, HookMemo, ReconcileFun, StateHolder } from "./Fiber";
import { EffectDestroyEvent, HookEffect, RenderWithDep } from "./Fiber";
import { quote, simpleNotEqual, alawaysTrue, ValueCenter, valueCenterOf, arrayNotEqual, EmptyFun, emptyArray } from "wy-helper";
import { draftParentFiber, hookAddEffect, hookAddFiber, hookAddResult, hookParentFiber, hookStateHoder, hookTempOps, revertParentFiber } from "./cache";


const hookIndex = {
  // effect: 0,
  // memo: 0,
  beforeFiber: undefined as (Fiber | undefined),
}
export function updateFunctionComponent(fiber: Fiber) {
  revertParentFiber()
  hookAddFiber(fiber)
  // hookIndex.effect = 0
  // hookIndex.memo = 0
  hookIndex.beforeFiber = undefined
  fiber.render()
  draftParentFiber();
  hookAddFiber(undefined)
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
  const isInit = holder.firstTime
  if (isInit) {
    //新增
    const hookEffects = holder.effects || []
    holder.effects = hookEffects
    const state: HookEffect<V, T> = {
      level,
      deps,
      isInit,
      shouldChange
    }
    const hookEffect = holder.envModel.createChangeAtom(state)
    hookEffects.push(hookEffect)
    holder.envModel.updateEffect(level, () => {
      hookAddEffect(holder.envModel.layoutEffect)
      const out = effect({
        beforeTrigger: undefined,
        isInit,
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
          isInit,
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

export function hookCreateChangeAtom() {
  const parentFiber = hookParentFiber()
  return parentFiber.envModel.createChangeAtom
}
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
export function renderFiber<T>(
  shouldChange: (a: T, b: T) => any,
  render: (e: FiberEvent<T>) => void,
  deps: T
): Fiber {
  const holder = hookStateHoder()
  let currentFiber: Fiber
  const isInit = holder.firstTime
  const parentFiber = holder.fiber
  if (isInit) {
    holder.fibers = holder.fibers || []
    //新增
    currentFiber = Fiber.create(
      holder.envModel,
      parentFiber,
      {
        shouldChange,
        render,
        event: {
          trigger: deps,
          isInit
        }
      })
    currentFiber.subOps = hookTempOps().createSub()
    holder.fibers.push(currentFiber)
  } else {
    if (!holder.fibers) {
      throw new Error("holder上没有fiber")
    }
    currentFiber = holder.fibers[holder.fiberIndex]
    holder.fiberIndex = holder.fiberIndex + 1
    currentFiber.changeRender(shouldChange, render, deps)
  }



  currentFiber.before.set(hookIndex.beforeFiber)
  //第一次要标记sibling
  if (hookIndex.beforeFiber) {
    hookIndex.beforeFiber.next.set(currentFiber)
  } else {
    parentFiber.firstChild.set(currentFiber)
  }
  currentFiber.next.set(undefined)
  //一直组装到最后
  parentFiber.lastChild.set(currentFiber)
  hookIndex.beforeFiber = currentFiber

  hookAddResult(currentFiber.subOps)
  return currentFiber
}
export interface Context<T> {
  useProvider(v: T): void
  /**
   * 似乎不能hookSelector,因为transition中闪建的节点,
   * @param getValue 
   * @param shouldUpdate 
   */
  useSelector<M>(getValue: (v: T) => M, shouldUpdate?: (a: M, b: M) => boolean): M
  useConsumer(): T
}
export function createContext<T>(v: T): Context<T> {
  return new ContextFactory(v)
}
let contextUid = 0
class ContextFactory<T> implements Context<T> {
  id = contextUid++
  constructor(
    public readonly out: T
  ) {
    this.defaultContext = valueCenterOf(out)
  }

  private readonly defaultContext: ValueCenter<T>
  useProvider(v: T) {
    const holder = hookStateHoder()
    const isInit = holder.firstTime
    if (isInit) {
      holder.contexts = holder.contexts || []
      holder.contexts.push({
        key: this,
        value: valueCenterOf(v)
      })
      holder.contextIndex = holder.contextIndex + 1
    } else {
      const providers = holder.contexts
      if (!providers) {
        throw new Error("原组件上不存在providers")
      }
      const index = holder.contextIndex
      const provider = providers[index]
      if (!provider) {
        throw new Error("原组件上不存在provider")
      }
      holder.contextIndex = index + 1
      if (provider.key != this) {
        throw new Error("原组件上provider不对应")
      }
      provider.value.set(v)
    }
  }
  private findProviderStateHoder(holder: StateHolder) {
    let begin = holder.contexts?.length || 0
    while (holder) {
      const providers = holder.contexts || emptyArray
      for (let i = begin - 1; i > -1; i--) {
        const provider = providers[i]
        if (provider.key == this) {
          return [holder, provider.value] as const
        }
      }
      begin = holder.parentContextIndex.get()
      holder = holder.parent
    }
  }
  useConsumer() {
    return this.useSelector(quote)
  }

  /**
   * 可能context没有改变,但本地render已经发生,
   * 每次render都要注册事件,也要销毁前一次注册的事件.必然要在fiber上记忆.
   * 
   * 每次执行都去重新定位,每次render指定到下一次.不能变成hook.因为先render而后通知,没有取消通知
   * @param getValue 
   * @param shouldUpdate 
   * @returns 
   */
  useSelector<M>(getValue: (v: T) => M, shouldUpdate: (a: M, b: M) => any = simpleNotEqual): M {
    const stateHolder = hookStateHoder()
    const provider = this.findProviderStateHoder(stateHolder)
    let context: ValueCenter<T> = this.defaultContext
    let notSelf = true
    if (provider) {
      context = provider[1]
      notSelf = provider[0].fiber != stateHolder.fiber
    }
    const thisValue = getValue(context.get())
    useLevelEffect(0, arrayNotEqual, function () {
      return [undefined, context.subscribe(function (value) {
        const m = getValue(value)
        if (notSelf && shouldUpdate(thisValue, m)) {
          stateHolder.fiber.effectTag.set("UPDATE")
        }
      })]
    }, [context, getValue, shouldUpdate, notSelf])
    return thisValue
  }
}

export function hookEffectTag() {
  const parentFiber = hookParentFiber()
  return parentFiber.effectTag.get()!
}
export function hookCommitAll() {
  const parentFiber = hookParentFiber()
  return parentFiber.envModel.commitAll
}

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
  const parentFiber = hookParentFiber()
  if (!parentFiber.makeDirtyAndRequestUpdate) {
    const requestReconcile = hookRequestReconcile()
    parentFiber.makeDirtyAndRequestUpdate = function () {
      requestReconcile(alawaysTrue)
    }
  }
  return parentFiber.makeDirtyAndRequestUpdate
}