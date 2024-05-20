import { Fiber, LayoutEffect, ReconcileFun } from "./Fiber";
import { EffectDestroyEvent, FiberImpl, HookEffect, RenderWithDep, StoreValue } from "./Fiber";
import { quote, simpleNotEqual, alawaysTrue, ValueCenter, valueCenterOf, arrayNotEqual, EmptyFun, getTheEmptyArray } from "wy-helper";
import { AbsTempOps, TempOps, TempSubOps } from "./tempOps";

const w = globalThis as any
const cache = (w.__better_react_one__ || {
  tempOps: undefined,
  wipFiber: undefined,
  allowWipFiber: false
}) as {
  tempOps: AbsTempOps<any>
  wipFiber?: FiberImpl
  allowWipFiber?: boolean
}
w.__better_react_one__ = cache




export function hookParentFiber() {
  if (cache.allowWipFiber) {
    return cache.wipFiber!
  }
  console.error('禁止在此处访问fiber')
  throw new Error('禁止在此处访问fiber')
}
export function draftParentFiber() {
  cache.allowWipFiber = false
}
export function revertParentFiber() {
  cache.allowWipFiber = true
}
const hookIndex = {
  effect: 0,
  memo: 0,
  beforeFiber: undefined as (FiberImpl | undefined),
}
export function updateFunctionComponent(fiber: FiberImpl) {
  revertParentFiber()
  cache.wipFiber = fiber

  hookIndex.effect = 0
  hookIndex.memo = 0
  hookIndex.beforeFiber = undefined

  cache.tempOps = fiber.subOps
  fiber.render()
  cache.tempOps = undefined!

  draftParentFiber();
  cache.wipFiber = undefined
}

export function hookTempOps() {
  return cache.tempOps
}

export function hookBeginTempOps(op: TempOps<any>) {
  const before = cache.tempOps
  cache.tempOps = op
  op.data.reset()
  return before
}
export function hookEndTempOps(op: AbsTempOps<any>) {
  cache.tempOps = op
}

export function hookAddResult(...vs: any[]) {
  if (!cache.tempOps) {
    throw new Error("必须在render中进行")
  }
  for (let i = 0; i < vs.length; i++) {
    cache.tempOps.addNode(vs[i])
  }
}

export type EffectDestroy<V, T> = (void | ((e: EffectDestroyEvent<V, T>) => void))
export type EffectResult<V, T> = [V, EffectDestroy<V, T>] | void
export type EffectEvent<V, T> = {
  trigger: T
  isInit: true
  value?: never
  beforeTrigger?: never
  setRealTime(): void
  layoutEffect: LayoutEffect
} | {
  trigger: T
  isInit: false
  value: V,
  beforeTrigger: T
  setRealTime(): void
  layoutEffect: LayoutEffect
}
/**
 * 必须有个依赖项,如果没有依赖项,如果组件有useFragment,则会不执行,造成不一致.
 * useMemo如果无依赖,则不需要使用useMemo,但useEffect没有依赖,仍然有意义.有依赖符合幂等,无依赖不需要幂等.
 * @param effect 
 * @param deps 
 */
export function useLevelEffect<V, T>(
  level: number,
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
      const out = effect({
        beforeTrigger: undefined,
        isInit,
        trigger: deps,
        setRealTime: parentFiber.envModel.setRealTime,
        layoutEffect: parentFiber.envModel.layoutEffect
      })
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
    if (state.shouldChange != shouldChange) {
      throw new Error('shouldChange发生改变')
    }
    hookIndex.effect = index + 1
    if (shouldChange(state.deps, deps)) {
      const newState: HookEffect<V, T> = {
        level,
        deps,
        isInit: false,
        shouldChange
      }
      hookEffect.set(newState)
      parentFiber.envModel.updateEffect(level, () => {
        if (state.destroy) {
          state.destroy({
            isDestroy: false,
            trigger: deps,
            value: state.value,
            beforeIsInit: state.isInit,
            beforeTrigger: state.deps,
            setRealTime: parentFiber.envModel.setRealTime,
            layoutEffect: parentFiber.envModel.layoutEffect
          })
        }
        const out = effect({
          beforeTrigger: state.deps,
          isInit,
          value: state.value,
          trigger: deps,
          setRealTime: parentFiber.envModel.setRealTime,
          layoutEffect: parentFiber.envModel.layoutEffect
        })
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
    const state = {
      value: effect({
        isInit,
        trigger: deps
      }),
      deps
    }
    revertParentFiber()
    const hook = parentFiber.envModel.createChangeAtom(state)
    hookMemos.push({
      value: hook,
      shouldChange
    })
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
    if (hook.shouldChange != shouldChange) {
      throw new Error("shouldChange发生改变")
    }
    hookIndex.memo = index + 1
    const state = hook.value.get()
    if (hook.shouldChange(state.deps, deps)) {
      //不处理
      draftParentFiber()
      const newState = {
        value: effect({
          beforeTrigger: state.deps,
          isInit: false,
          trigger: deps,
          beforeValue: state.value
        }),
        deps
      }
      revertParentFiber()

      hook.value.set(newState)
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
  let currentFiber: FiberImpl
  const isInit = parentFiber.effectTag.get() == 'PLACEMENT'
  if (isInit) {
    //新增
    currentFiber = FiberImpl.createFix(
      parentFiber.envModel,
      parentFiber,
      shouldChange,
      {
        render,
        deps,
        isNew: true,
      },
      dynamicChild)
    currentFiber.subOps = cache.tempOps.createSub()

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
    let oldFiber: FiberImpl | void = undefined
    if (hookIndex.beforeFiber) {
      oldFiber = hookIndex.beforeFiber.next.get()
    }
    if (!oldFiber) {
      oldFiber = parentFiber.firstChild.get()
    }
    if (!oldFiber) {
      throw new Error("非预期地多出现了fiber")
    }
    if (oldFiber.shouldChange != shouldChange) {
      throw new Error("shouldChange发生改变")
    }
    currentFiber = oldFiber

    hookIndex.beforeFiber = currentFiber
    currentFiber.changeRender(render, deps)
  }

  cache.tempOps.addNode(currentFiber.subOps)

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
  private findProvider(_fiber: FiberImpl) {
    let fiber = _fiber as FiberImpl | undefined
    while (fiber) {
      if (fiber.contextProvider) {
        const providers = fiber.contextProvider
        if (providers.has(this)) {
          return providers.get(this) as ValueCenter<T>
        }
      }
      fiber = fiber.parent
    }
    return this.defaultContext
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
    const context = this.findProvider(parentFiber)
    const thisValue = getValue(context.get())
    useLevelEffect(0, arrayNotEqual, function () {
      return [undefined, context.subscribe(function (value) {
        const m = getValue(value)
        if (shouldUpdate(thisValue, m)) {
          parentFiber.effectTag.set("UPDATE")
        }
      })]
    }, [context, getValue, shouldUpdate])
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