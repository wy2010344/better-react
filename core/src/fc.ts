import { EffectDestroyEvent, Fiber, FiberConfig, HookEffect, MemoEvent, RenderWithDep } from "./Fiber";
import { quote, simpleNotEqual, alawaysTrue, ValueCenter, valueCenterOf, arrayNotEqual } from "wy-helper";

const w = globalThis as any
const cache = (w.__better_react_one__ || {
  wipFiber: undefined,
  allowWipFiber: false
}) as {
  wipFiber?: Fiber
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
  effects: new Map<number, number>(),
  memo: 0,
  beforeFiber: undefined as (Fiber | undefined),
}

export function updateFunctionComponent(fiber: Fiber) {
  revertParentFiber()
  cache.wipFiber = fiber

  hookIndex.effects.clear()
  hookIndex.memo = 0
  hookIndex.beforeFiber = undefined
  //新建一个
  fiber.resultArray.set([])
  fiber.render()
  draftParentFiber();
  cache.wipFiber = undefined
}

export type EffectResult<T> = (void | ((e: EffectDestroyEvent<T>) => void))
export type EffectEvent<T> = {
  trigger: T
  isInit: boolean
  beforeTrigger?: T
  setRealTime(): void
}
/**
 * 必须有个依赖项,如果没有依赖项,如果组件有useFragment,则会不执行,造成不一致.
 * useMemo如果无依赖,则不需要使用useMemo,但useEffect没有依赖,仍然有意义.有依赖符合幂等,无依赖不需要幂等.
 * @param effect 
 * @param deps 
 */
export function useLevelEffect<T>(
  level: number,
  shouldChange: (a: T, b: T) => any,
  effect: (e: EffectEvent<T>) => EffectResult<T>, deps: T): void {
  const parentFiber = hookParentFiber()
  const isInit = parentFiber.effectTag.get() == 'PLACEMENT'
  if (isInit) {
    //新增
    const hookEffects = parentFiber.hookEffects || new Map()
    parentFiber.hookEffects = hookEffects
    const state: HookEffect<T> = {
      deps,
      isInit,
      shouldChange
    }
    const hookEffect = parentFiber.envModel.createChangeAtom(state)
    const old = hookEffects.get(level)
    const array = old || []
    if (!old) {
      hookEffects.set(level, array)
    }
    array.push(hookEffect)
    parentFiber.envModel.updateEffect(level, () => {
      state.destroy = effect({
        beforeTrigger: undefined,
        isInit, trigger: deps,
        setRealTime: parentFiber.envModel.setRealTime
      })
    })
  } else {
    const hookEffects = parentFiber.hookEffects
    if (!hookEffects) {
      throw new Error("原组件上不存在hookEffects")
    }
    const index = hookIndex.effects.get(level) || 0
    const levelEffect = hookEffects.get(level)
    if (!levelEffect) {
      throw new Error(`未找到该level effect ${level}`)
    }
    const hookEffect = levelEffect[index]
    if (!hookEffect) {
      throw new Error("出现了更多的effect")
    }
    const state = hookEffect.get()
    if (state.shouldChange != shouldChange) {
      throw new Error('shouldChange发生改变')
    }
    hookIndex.effects.set(level, index + 1)
    if (shouldChange(state.deps, deps)) {
      const newState: HookEffect<T> = {
        deps,
        isInit: false,
        shouldChange
      }
      hookEffect.set(newState)
      parentFiber.envModel.updateEffect(level, () => {
        if (state.destroy) {
          state.destroy({
            trigger: deps,
            beforeIsInit: state.isInit,
            beforeTrigger: state.deps,
            setRealTime: parentFiber.envModel.setRealTime
          })
        }
        newState.destroy = effect({
          beforeTrigger: state.deps,
          isInit,
          trigger: deps,
          setRealTime: parentFiber.envModel.setRealTime
        })
      })
    }
  }
}

export function hookAddResult(value: any) {
  const parentFiber = hookParentFiber()
  if (!parentFiber.config.allowAdd?.(value)) {
    console.log('该fiber不允许添加这个值', value)
    throw new Error('该fiber不允许添加这个值')
  }
  parentFiber.resultArray.get().push(value)
}

export function hookCreateChangeAtom() {
  const parentFiber = hookParentFiber()
  return parentFiber.envModel.createChangeAtom
}
/**
 * 通过返回函数,能始终通过函数访问fiber上的最新值
 * @param effect 
 * @param deps 
 * @returns 
 */
export function useBaseMemo<T, V>(
  shouldChange: (a: V, b: V) => any,
  effect: (e: MemoEvent<V>) => T,
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
          trigger: deps
        }),
        deps
      }
      revertParentFiber()

      hook.value.set(newState)
    }
    return state.value
  }
}
export function renderBaseFiber<T>(
  dynamicChild: boolean,
  config: FiberConfig,
  ...[shouldChange, render, deps]: RenderWithDep<T>
) {
  const parentFiber = hookParentFiber()
  let currentFiber: Fiber
  const isInit = parentFiber.effectTag.get() == 'PLACEMENT'
  if (isInit) {
    //新增
    currentFiber = Fiber.createFix(
      parentFiber.envModel,
      parentFiber,
      config,
      shouldChange,
      {
        render,
        deps,
        isNew: true,
      },
      dynamicChild)
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
    if (oldFiber.config != config) {
      throw new Error("FiberConfig发生改变")
    }
    if (oldFiber.shouldChange != shouldChange) {
      throw new Error("shouldChange发生改变")
    }
    currentFiber = oldFiber

    hookIndex.beforeFiber = currentFiber
    currentFiber.changeRender(render, deps)
  }
  if (!parentFiber.config.allowFiber) {
    throw new Error('该fiber不允许添加后继fiber')
  }
  parentFiber.resultArray.get().push(currentFiber.lazyGetResultArray)
}
/**
 * 两种方式,一种是传任意props进来,有一个公用的处理函数,和一个判断props是否发生变成
 * 一种是有一个主函数,有一个deps,deps发生变更,主函数执行,跟useMemo/useEffect一样,这里跟useEffect更相似,依赖是可选的
 * 后者更简单,前者更性能,主要是props可能是构造的object,既然可以构造函数,没必要构造多个object.
 * 之前的useMemo/useEffect是否也可以依赖props与shouldUpdate?
 * @param render
 * @param props 
 * @param shouldUpdate 
 * @returns 
 */
export function renderFiber<T>(
  config: FiberConfig,
  ...[shouldChange, render, deps]: RenderWithDep<T>
) {
  return renderBaseFiber(false, config, shouldChange, render, deps)
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
class ContextFactory<T> implements Context<T>{
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
  private findProvider(_fiber: Fiber) {
    let fiber = _fiber as Fiber | undefined
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
      return context.subscribe(function (value) {
        const m = getValue(value)
        if (shouldUpdate(thisValue, m)) {
          parentFiber.effectTag.set("UPDATE")
        }
      })
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

export function hookRequestReconcile() {
  const parentFiber = hookParentFiber()
  if (!parentFiber.requestReconcile) {
    parentFiber.requestReconcile = function (callback) {
      if (parentFiber.destroyed) {
        console.log("更新已经销毁的fiber")
        return
      }
      parentFiber.envModel.reconcile(function () {
        if (callback()) {
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