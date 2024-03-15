import { Fiber, HookEffect, RenderWithDep, VirtaulDomNode, VirtualDomOperator } from "./Fiber";
import { arrayEqual, arrayNotEqualDepsWithEmpty, quote, simpleEqual, alawaysTrue, ValueCenter, valueCenterOf } from "wy-helper";

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

  fiber.render()
  draftParentFiber();
  cache.wipFiber = undefined
}

export type EffectResult<T> = (void | ((deps: T) => void))
/**
 * 必须有个依赖项,如果没有依赖项,如果组件有useFragment,则会不执行,造成不一致.
 * useMemo如果无依赖,则不需要使用useMemo,但useEffect没有依赖,仍然有意义.有依赖符合幂等,无依赖不需要幂等.
 * @param effect 
 * @param deps 
 */
export function useLevelEffect<T extends readonly any[] = readonly any[]>(
  level: number,
  effect: (args: T, isInit: boolean) => EffectResult<T>, deps: T): void
export function useLevelEffect(
  level: number,
  effect: () => EffectResult<any[]>,
  deps?: readonly any[]): void
export function useLevelEffect(
  level: number,
  effect: any, deps?: any) {
  const parentFiber = hookParentFiber()
  const isInit = parentFiber.effectTag.get() == 'PLACEMENT'
  if (isInit) {
    //新增
    const hookEffects = parentFiber.hookEffects || new Map()
    parentFiber.hookEffects = hookEffects
    const state: HookEffect = {
      deps
    }
    const hookEffect = parentFiber.envModel.createChangeAtom(state)
    const old = hookEffects.get(level)
    const array = old || []
    if (!old) {
      hookEffects.set(level, array)
    }
    array.push(hookEffect)
    parentFiber.envModel.updateEffect(level, () => {
      state.destroy = effect(deps, isInit)
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
    hookIndex.effects.set(level, index + 1)
    if (arrayNotEqualDepsWithEmpty(state.deps, deps)) {
      const newState: HookEffect = {
        deps
      }
      hookEffect.set(newState)
      parentFiber.envModel.updateEffect(level, () => {
        if (state.destroy) {
          state.destroy(state.deps)
        }
        newState.destroy = effect(deps, isInit)
      })
    }
  }
}

export function hookGetCreateChangeAtom() {
  const parentFiber = hookParentFiber()
  return parentFiber.envModel.createChangeAtom
}
/**
 * 通过返回函数,能始终通过函数访问fiber上的最新值
 * @param effect 
 * @param deps 
 * @returns 
 */
export function useBaseMemoGet<T, V extends readonly any[] = readonly any[]>(
  effect: (deps: V, isInit: boolean) => T,
  deps: V,
): () => T {
  const parentFiber = hookParentFiber()
  const isInit = parentFiber.effectTag.get() == "PLACEMENT"
  if (isInit) {
    const hookMemos = parentFiber.hookMemo || []
    parentFiber.hookMemo = hookMemos

    draftParentFiber()
    const state = {
      value: effect(deps, isInit),
      deps,
    }
    revertParentFiber()

    const hook = parentFiber.envModel.createChangeAtom(state)
    const get = () => hook.get().value
    hookMemos.push({
      value: hook,
      get,
    })
    return get
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
    hookIndex.memo = index + 1
    const state = hook.value.get()
    if (arrayEqual(state.deps, deps, simpleEqual)) {
      //不处理
      return hook.get
    } else {

      draftParentFiber()
      const newState = {
        value: effect(deps, isInit),
        deps
      }
      revertParentFiber()

      hook.value.set(newState)
      return hook.get
    }
  }
}
export function renderBaseFiber<T extends readonly any[] = readonly any[]>(
  dom: VirtualDomOperator,
  dynamicChild: boolean,
  ...vs: RenderWithDep<T>
): VirtaulDomNode
export function renderBaseFiber<T extends readonly any[] = readonly any[]>(
  dom: void,
  dynamicChild: boolean,
  ...vs: RenderWithDep<T>
): void
export function renderBaseFiber(
  dom: any,
  dynamicChild: boolean,
  render: any,
  deps?: any
): any {
  const parentFiber = hookParentFiber()
  let currentFiber: Fiber
  const isInit = parentFiber.effectTag.get() == 'PLACEMENT'
  if (isInit) {
    //新增
    const vdom = dom ? dom[0](dom[2]) : undefined
    currentFiber = Fiber.createFix(
      parentFiber.envModel,
      parentFiber,
      vdom,
      {
        render,
        deps
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
    currentFiber = oldFiber

    hookIndex.beforeFiber = currentFiber
    currentFiber.changeRender(render, deps)
  }
  const currentDom = currentFiber.dom
  if (currentDom) {
    if (!dom) {
      throw new Error('需要更新参数')
    }
    currentDom.useUpdate(dom[1], isInit)
  }
  return currentDom
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
export function renderFiber<T extends readonly any[] = readonly any[]>(
  dom: VirtualDomOperator,
  ...vs: RenderWithDep<T>
): VirtaulDomNode
export function renderFiber<T extends readonly any[] = readonly any[]>(
  dom: void,
  ...vs: RenderWithDep<T>
): void
export function renderFiber(
  dom: any,
  render: any,
  deps?: any
) {
  return renderBaseFiber(dom, false, render, deps)
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
  useSelector<M>(getValue: (v: T) => M, shouldUpdate: (a: M, b: M) => any = simpleEqual): M {
    const parentFiber = hookParentFiber()
    const context = this.findProvider(parentFiber)
    const thisValue = getValue(context.get())
    useLevelEffect(0, function () {
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
export function hookGetFlushSync() {
  const parentFiber = hookParentFiber()
  return parentFiber.envModel.flushSync
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