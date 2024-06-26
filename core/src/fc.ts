import { Fiber, HookMemo, ReconcileFun } from "./Fiber";
import { EffectDestroyEvent, HookEffect, RenderWithDep } from "./Fiber";
import { quote, simpleNotEqual, alawaysTrue, ValueCenter, valueCenterOf, arrayNotEqual, EmptyFun } from "wy-helper";
import { draftParentFiber, hookAddEffect, hookAddFiber, hookParentFiber, hookTempOps, revertParentFiber } from "./cache";


const hookIndex = {
  effect: 0,
  memo: 0,
  beforeFiber: undefined as (Fiber | undefined),
}
export function updateFunctionComponent(fiber: Fiber) {
  revertParentFiber()
  hookAddFiber(fiber)
  hookIndex.effect = 0
  hookIndex.memo = 0
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
  const parentFiber = hookParentFiber()
  const isInit = parentFiber.effectTag.get() == 'PLACEMENT'
  if (isInit) {
    //新增
    const hookEffects = parentFiber.hookEffects || []
    parentFiber.hookEffects = hookEffects
    const state: HookEffect<V, T> = {
      level,
      deps,
      isInit,
      shouldChange
    }
    const hookEffect = parentFiber.envModel.createChangeAtom(state)
    hookEffects.push(hookEffect)
    parentFiber.envModel.updateEffect(level, () => {
      hookAddEffect(parentFiber.envModel.layoutEffect)
      const out = effect({
        beforeTrigger: undefined,
        isInit,
        trigger: deps,
        setRealTime: parentFiber.envModel.setRealTime
      })
      hookAddEffect(undefined)
      if (out) {
        [state.value, state.destroy] = out
      }
    })
  } else {
    const hookEffects = parentFiber.hookEffects
    if (!hookEffects) {
      throw new Error("原组件上不存在hookEffects")
    }
    const index = hookIndex.effect
    const hookEffect = hookEffects[index]
    if (!hookEffect) {
      throw new Error("出现了更多的effect")
    }
    const state = hookEffect.get()
    hookIndex.effect = index + 1
    if (state.shouldChange(state.deps, deps)) {
      const newState: HookEffect<V, T> = {
        level,
        deps,
        isInit: false,
        shouldChange
      }
      hookEffect.set(newState)
      parentFiber.envModel.updateEffect(level, () => {
        if (state.destroy) {
          hookAddEffect(parentFiber.envModel.layoutEffect)
          state.destroy({
            isDestroy: false,
            trigger: deps,
            value: state.value,
            beforeIsInit: state.isInit,
            beforeTrigger: state.deps,
            setRealTime: parentFiber.envModel.setRealTime
          })
          hookAddEffect(undefined)
        }
        hookAddEffect(parentFiber.envModel.layoutEffect)
        const out = effect({
          beforeTrigger: state.deps,
          isInit,
          value: state.value,
          trigger: deps,
          setRealTime: parentFiber.envModel.setRealTime
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
export type MemoCacheEvent<T, M> = {
  trigger: T
  isInit: boolean
  beforeTrigger?: never
  beforeValue?: never
} | {
  trigger: T
  isInit: boolean
  beforeTrigger: T
  beforeValue: M
}
/**
 * 通过返回函数,能始终通过函数访问fiber上的最新值
 * @param effect 
 * @param deps 
 * @returns 
 */
export function useBaseMemo<T, V>(
  shouldChange: (a: V, b: V) => any,
  effect: (e: MemoCacheEvent<V, T>) => T,
  deps: V,
): T {
  const parentFiber = hookParentFiber()
  const isInit = parentFiber.effectTag.get() == "PLACEMENT"
  if (isInit) {
    const hookMemos = parentFiber.hookMemo || []
    parentFiber.hookMemo = hookMemos
    draftParentFiber()
    const state: HookMemo<T, V> = {
      value: effect({
        isInit,
        trigger: deps
      }),
      deps,
      shouldChange
    }
    revertParentFiber()
    const hook = parentFiber.envModel.createChangeAtom(state)
    hookMemos.push(hook)
    return state.value
  } else {
    const hookMemos = parentFiber.hookMemo
    if (!hookMemos) {
      throw new Error("原组件上不存在memos")
    }
    const index = hookIndex.memo
    const hook = hookMemos[index]
    if (!hook) {
      throw new Error("出现了更多的memo")
    }
    const state = hook.get()
    hookIndex.memo = index + 1
    if (state.shouldChange(state.deps, deps)) {
      //不处理
      draftParentFiber()
      const newState: HookMemo<T, V> = {
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
export function renderBaseFiber<T>(
  dynamicChild: boolean,
  ...[shouldChange, render, deps]: RenderWithDep<T>
): Fiber {
  const parentFiber = hookParentFiber()
  let currentFiber: Fiber
  const isInit = parentFiber.effectTag.get() == 'PLACEMENT'
  if (isInit) {
    //新增
    currentFiber = Fiber.createFix(
      parentFiber.envModel,
      parentFiber,
      {
        shouldChange,
        render,
        event: {
          trigger: deps,
          isInit
        }
      },
      dynamicChild)
    currentFiber.subOps = hookTempOps().createSub()

    currentFiber.before.set(hookIndex.beforeFiber)
    //第一次要标记sibling
    if (hookIndex.beforeFiber) {
      hookIndex.beforeFiber.next.set(currentFiber)
    } else {
      parentFiber.firstChild.set(currentFiber)
    }
    //一直组装到最后
    parentFiber.lastChild.set(currentFiber)
    hookIndex.beforeFiber = currentFiber

  } else {
    //修改
    let oldFiber: Fiber | void = undefined
    if (hookIndex.beforeFiber) {
      oldFiber = hookIndex.beforeFiber.next.get()
    }
    if (!oldFiber) {
      oldFiber = parentFiber.firstChild.get()
    }
    if (!oldFiber) {
      throw new Error("非预期地多出现了fiber")
    }
    currentFiber = oldFiber
    hookIndex.beforeFiber = currentFiber
    currentFiber.changeRender(shouldChange, render, deps)
  }
  hookTempOps().addNode(currentFiber.subOps)
  return currentFiber
}
/**
 * 这里不预设加入result里,是为了可能的portal
 * @param render
 * @param props 
 * @param shouldUpdate 
 * @returns 
 */
export function renderFiber<T>(
  ...[shouldChange, render, deps]: RenderWithDep<T>
) {
  return renderBaseFiber(false, shouldChange, render, deps)
}
export interface Context<T> {
  hookProvider(v: T): void
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
  hookProvider(v: T) {
    const parentFiber = hookParentFiber()
    const map = parentFiber.contextProvider || new Map()
    parentFiber.contextProvider = map
    let hook = map.get(this) as ValueCenter<T>
    if (!hook) {
      //同作用域会覆盖
      hook = valueCenterOf(v)
      map.set(this, hook)
    }
    hook.set(v)
  }
  private findProviderFiber(_fiber: Fiber) {
    let fiber = _fiber as Fiber | undefined
    while (fiber) {
      if (fiber.contextProvider) {
        const providers = fiber.contextProvider
        if (providers.has(this)) {
          return fiber
        }
      }
      fiber = fiber.parent
    }
  }
  useConsumer() {
    return this.useSelector(quote)
  }

  /**
   * 可能context没有改变,但本地render已经发生,
   * 每次render都要注册事件,也要销毁前一次注册的事件.必然要在fiber上记忆.
   * @param getValue 
   * @param shouldUpdate 
   * @returns 
   */
  useSelector<M>(getValue: (v: T) => M, shouldUpdate: (a: M, b: M) => any = simpleNotEqual): M {
    const parentFiber = hookParentFiber()
    const providerFiber = this.findProviderFiber(parentFiber)
    const context = providerFiber?.contextProvider?.get(this) || this.defaultContext
    const thisValue = getValue(context.get())
    const notSelf = providerFiber != parentFiber
    useLevelEffect(0, arrayNotEqual, function () {
      return [undefined, context.subscribe(function (value) {
        const m = getValue(value)
        if (notSelf && shouldUpdate(thisValue, m)) {
          parentFiber.effectTag.set("UPDATE")
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
  const parentFiber = hookParentFiber()
  if (!parentFiber.requestReconcile) {
    parentFiber.requestReconcile = function (callback) {
      if (parentFiber.destroyed) {
        console.log("更新已经销毁的fiber")
        return
      }
      parentFiber.envModel.reconcile(function () {
        if (callback(parentFiber.envModel.updateEffect)) {
          if (parentFiber.destroyed) {
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