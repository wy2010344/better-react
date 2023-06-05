import { WithDraftFiber } from ".";
import { addDraftConsumer, ChangeAtomValue, createChangeAtom, updateEffect, UpdateEffectLevel } from "./commitWork";
import { Fiber, fiberDataClone, getData, getEditData, HookContextCosumer, HookEffect, HookValue, HookValueSet, StoreRef, ChangeBodyFiber, isChangeBodyFiber, UpdateFiber, NotChangeFiber, isWithDraftFiber } from "./Fiber";
import { reconcile } from "./reconcile";


let wipFiber: ChangeBodyFiber | undefined = undefined

export function useCurrentFiber() {
  if (allowWipFiber) {
    return wipFiber!
  }
  console.error('禁止在此处访问fiber')
  throw new Error('禁止在此处访问fiber')
}

let allowWipFiber = true
export function draftFiber() {
  allowWipFiber = false
}
export function revertFiber() {
  allowWipFiber = true
}
const hookIndex = {
  state: 0,
  effect: [
    0, 0, 0
  ],
  memo: 0,
  beforeFiber: undefined as (Fiber | undefined),
  cusomer: 0
}

export function updateFunctionComponent(fiber: ChangeBodyFiber) {
  wipFiber = fiber
  hookIndex.state = 0
  hookIndex.effect = [0, 0, 0]
  hookIndex.memo = 0

  hookIndex.beforeFiber = undefined

  hookIndex.cusomer = 0
  fiber.draft.render(fiber.draft.deps)
  wipFiber = undefined
}

export type ReducerFun<F, T> = (old: T, action: F) => T
export type ReducerResult<F, T> = [T, HookValueSet<F, T>];
/**
 * 依赖外部初始值
 * 也有只依赖一个函数,则值为常值如0,另作一个封装
 * @param reducer 
 * @param v 
 * @param init 
 */
export function useReducer<F, M, T>(reducer: ReducerFun<F, T>, v: M, init: (m: M) => T): ReducerResult<F, T>
export function useReducer<F, T>(reducer: ReducerFun<F, T>, v: T): ReducerResult<F, T>
export function useReducer<F, T = undefined>(reducer: ReducerFun<F, T>): ReducerResult<F, T | undefined>
export function useReducer() {
  const [reducer, init, oldTrans] = arguments
  const currentFiber = useCurrentFiber()
  if (currentFiber.effectTag == 'PLACEMENT') {
    //新增
    const hookValues = currentFiber.hookValue || []
    currentFiber.hookValue = hookValues
    const trans = oldTrans || quote
    const value = createChangeAtom(trans(init))
    const hook: HookValue<any, any> = {
      value,
      set: buildSetValue(value, currentFiber, reducer)
    }
    hookValues.push(hook)
    return [value.get(), hook.set]
  } else {
    //修改
    const hookValues = currentFiber.hookValue
    if (!hookValues) {
      throw new Error("原组件上不存在reducer")
    }
    const hook = hookValues[hookIndex.state]
    if (!hook) {
      throw new Error("出现了更多的reducer")
    }
    hookIndex.state++
    return [hook.value.get(), hook.set]
  }
}
/**
 * setState需要做成异步提交
 * 提交的时候,只是在一个副本树上修改
 * 副本树一些节点修改后,遍历修改在树上
 * 在未提交前舍弃副本树
 * 
 * 可以把树节点记为脏存放在另一个池中,只处理这个池的脏数据,克隆处理
 * 提交的时候,将克隆替换成正式数据
 * 但是脏节点是嵌套的
 * useMemo如果是自定义成ref,无法捕获设置值.useEffect还好,必须是提交的时候执行.useState需要克隆.useConsumer需要移除监听.这些都是未提交的内容.dom的修改也在提交时才生效.
 * 用表的思维去思考,特别是provider和consumer.添加了,但其标记还是draft.
 * 只添加记录操作方式而不具体操作,在提交时统一操作.
 * 
 * 很有可能,这个fiber是被更新了的,比如移位
 */
function buildSetValue<T, F>(atom: ChangeAtomValue<T>, fiber: Fiber, reducer: (old: T, action: F) => T) {
  return function (temp: F, after?: (v: T) => void) {
    reconcile({
      beforeLoop() {
        toWithDraftFiber(fiber)
        //这里如果多次设置值,则会改动多次,依前一次结果累积.
        const oldValue = atom.get()
        const newValue = reducer(oldValue, temp)
        atom.set(newValue)
      },
      afterLoop: after ? () => {
        after(atom.get())
      } : undefined
    })
  }
}

/**
 * 设置状态、context通知,将其更新为脏
 * @param fiber 
 * @returns 
 */
export function toWithDraftFiber(fiber: Fiber): WithDraftFiber {
  const nFiber = fiber as any
  if (!nFiber.effectTag) {
    nFiber.effectTag = "UPDATE"
  }
  if (!nFiber.draft) {
    nFiber.draft = fiberDataClone(nFiber.current)
  }
  return nFiber
}
export function storeRef<T>(value: T) {
  return {
    get() {
      return value
    },
    set(v: T) {
      value = v
    }
  } as StoreRef<T>
}

export function simpleEqual<T>(a: T, b: T) {
  return a == b
}

/**6种情况为false,NaN是数字类型*/
export type FalseType = false | undefined | null | 0 | ""
export function arrayEqual<T>(a1: readonly T[], a2: readonly T[], equal: (x: T, y: T) => boolean) {
  if (a1 == a2) {
    return true
  }
  const len = a1.length
  if (a2.length == len) {
    for (let i = 0; i < len; i++) {
      if (!equal(a1[i], a2[i])) {
        return false
      }
    }
    return true
  }
  return false
}
export const EMPTYCONSTARRAY = [] as readonly any[]

export type EffectResult = (void | (() => void))

function buildUseEffect(level: UpdateEffectLevel) {
  /**
   * 必须有个依赖项,如果没有依赖项,如果组件有useFragment,则会不执行,造成不一致.
   * useMemo如果无依赖,则不需要使用useMemo,但useEffect没有依赖,仍然有意义.有依赖符合幂等,无依赖不需要幂等.
   * @param effect 
   * @param deps 
   */
  function useEffect<T extends readonly any[] = readonly any[]>(effect: (args: T) => EffectResult, deps: T): void
  function useEffect(effect: () => EffectResult, deps?: readonly any[]): void
  function useEffect(effect: any, deps?: any) {
    const currentFiber = useCurrentFiber()
    if (currentFiber.effectTag == 'PLACEMENT') {
      //新增
      const hookEffects = currentFiber.hookEffects || [[], [], []]
      currentFiber.hookEffects = hookEffects
      const state: HookEffect = {
        deps
      }
      const hookEffect = createChangeAtom(state)
      hookEffects[level].push(hookEffect)
      updateEffect(() => {
        state.destroy = effect(deps)
      }, level)
    } else {
      const hookEffects = currentFiber.hookEffects
      if (!hookEffects) {
        throw new Error("原组件上不存在hookEffects")
      }
      const index = hookIndex.effect[level]
      const hookEffect = hookEffects[level][index]
      if (!hookEffect) {
        throw new Error("出现了更多的effect")
      }
      const state = hookEffect.get()
      hookIndex.effect[level] = index + 1
      if (arrayNotEqualDepsWithEmpty(state.deps, deps)) {
        const newState: HookEffect = {
          deps
        }
        hookEffect.set(newState)
        updateEffect(() => {
          if (state.destroy) {
            state.destroy()
          }
          newState.destroy = effect(deps)
        }, level)
      }
    }
  }
  return useEffect
}

export const useBeforeAttrEffect = buildUseEffect(0)
export const useAttrEffect = buildUseEffect(1)
export const useEffect = buildUseEffect(2)

export function arrayNotEqualDepsWithEmpty(a?: readonly any[], b?: readonly any[]) {
  return !(a && b && arrayEqual(a, b, simpleEqual))
}

export function useMemo<T, V extends readonly any[] = readonly any[]>(effect: (deps: V) => T, deps: V): T {
  const currentFiber = useCurrentFiber()
  if (currentFiber.effectTag == "PLACEMENT") {
    const hookMemos = currentFiber.hookMemo || []
    currentFiber.hookMemo = hookMemos

    draftFiber()
    const state = {
      value: effect(deps),
      deps
    }
    revertFiber()

    const hook = createChangeAtom(state)
    hookMemos.push(hook)
    return state.value
  } else {
    const hookMemos = currentFiber.hookMemo
    if (!hookMemos) {
      throw new Error("原组件上不存在memos")
    }
    const index = hookIndex.memo
    const hook = hookMemos[index]
    if (!hook) {
      throw new Error("出现了更多的memo")
    }
    hookIndex.memo = index + 1
    const state = hook.get()
    if (arrayEqual(state.deps, deps, simpleEqual)) {
      //不处理
      return state.value
    } else {

      draftFiber()
      const newState = {
        value: effect(deps),
        deps
      }
      revertFiber()

      hook.set(newState)
      return newState.value
    }
  }
}

type UserOldFiber = UpdateFiber | NotChangeFiber
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
export function useFiber<T extends readonly any[] = readonly any[]>(render: (args: T) => void, deps: T): Fiber
export function useFiber(render: () => void, deps?: readonly any[]): Fiber
export function useFiber(render: any, deps?: any) {
  const currentFiber = useCurrentFiber()
  if (currentFiber.effectTag == 'PLACEMENT') {
    //新增
    const hook: Fiber = {
      effectTag: "PLACEMENT",
      parent: currentFiber,
      draft: {
        render,
        deps,
        prev: hookIndex.beforeFiber
      }
    }
    //第一次要标记sibling
    if (hookIndex.beforeFiber) {
      getEditData(hookIndex.beforeFiber).sibling = hook
    } else {
      getEditData(currentFiber).child = hook
    }
    //一直组装到最后
    getEditData(currentFiber).lastChild = hook

    hookIndex.beforeFiber = hook
    return hook
  } else {
    //修改
    let oldFiber: Fiber | undefined
    if (hookIndex.beforeFiber) {
      oldFiber = getData(hookIndex.beforeFiber).sibling
    }
    if (!oldFiber) {
      oldFiber = currentFiber.draft.child
    }
    if (!oldFiber) {
      throw new Error("非预期地多出现了fiter")
    }
    hookIndex.beforeFiber = oldFiber
    simpleUpdateFiber(oldFiber, render, deps)
    return oldFiber
  }
}

/**
 * 这里的Fiber,只能是UpdateFiber或NoChangeFiber
 * @param oldFiber 
 * @param render 
 * @param deps 
 */
export function simpleUpdateFiber(
  oldFiber: Fiber,
  render: (vs: any[]) => void,
  deps?: any[]
) {
  if (isWithDraftFiber(oldFiber)) {
    if (isChangeBodyFiber(oldFiber)) {
      //已经被标记为脏,需要更新,则直接更新
      oldFiber.draft.render = render
      oldFiber.draft.deps = deps
    } else {
      const msg = "此处不允许有排序的Fiber"
      console.error(msg, oldFiber)
      throw new Error(msg)
    }
  } else {
    if (arrayNotEqualDepsWithEmpty(oldFiber.current.deps, deps)) {
      //检查出来需要更新
      const draft = toWithDraftFiber(oldFiber).draft
      draft.render = render
      draft.deps = deps
    }
  }
}

export interface Context<T> {
  useProvider(v: T): void
  useSelector<M>(getValue: (v: T) => M, shouldUpdate?: (a: M, b: M) => boolean): M
  useConsumer(): T
}
export function quote<T>(v: T) { return v }
export function createContext<T>(v: T): Context<T> {
  return new ContextFactory(v)
}
let contextUid = 0
class ContextFactory<T> implements Context<T>{
  id = contextUid++
  constructor(
    public readonly out: T
  ) {
    this.defaultContext = this.createProvider(out)
  }

  private readonly defaultContext: ContextProvider<T>
  private createProvider(value: T): ContextProvider<T> {
    return new ContextProvider(value, this)
  }
  private createConsumer<M>(fiber: Fiber, getValue: (v: T) => M, shouldUpdate?: (a: M, b: M) => boolean): ContextListener<T, M> {
    return new ContextListener(this.findProvider(fiber), fiber, getValue, shouldUpdate)
  }
  useProvider(v: T) {
    let map: Map<any, {
      changeValue(v: any): void
    }>
    const currentFiber = useCurrentFiber()
    if (currentFiber.contextProvider) {
      map = currentFiber.contextProvider
    } else {
      map = new Map()
      currentFiber.contextProvider = map
    }
    let hook = map.get(this)
    if (!hook) {
      hook = this.createProvider(v)
      map.set(this, hook)
    }
    hook.changeValue(v)
  }
  /**
   * @param getValue 
   * @param shouldUpdate 
   * @returns 
   */
  useSelector<M>(getValue: (v: T) => M, shouldUpdate?: (a: M, b: M) => any): M {
    const currentFiber = useCurrentFiber()
    if (currentFiber.effectTag == "PLACEMENT") {
      const hookConsumers = currentFiber.hookContextCosumer || []
      currentFiber.hookContextCosumer = hookConsumers

      const hook: HookContextCosumer<T, M> = this.createConsumer(currentFiber, getValue, shouldUpdate)
      hookConsumers.push(hook)
      addDraftConsumer(hook)
      //如果draft废弃,需要移除该hook
      return hook.getValue()
    } else {
      const hookConsumers = currentFiber.hookContextCosumer
      if (!hookConsumers) {
        throw new Error("原组件上不存在hookConsumers")
      }
      const index = hookIndex.cusomer
      const hook = hookConsumers[index]
      if (!hook) {
        throw new Error("没有出现更多consumes")
      }
      hook.select = getValue
      hook.shouldUpdate = shouldUpdate
      hookIndex.cusomer = index + 1
      return hook.getValue()
    }
  }
  useConsumer() {
    return this.useSelector(quote)
  }
  private findProvider(_fiber: Fiber) {
    let fiber = _fiber as Fiber | undefined
    while (fiber) {
      if (fiber.contextProvider) {
        const providers = fiber.contextProvider
        if (providers.has(this)) {
          return providers.get(this) as ContextProvider<T>
        }
      }
      fiber = fiber.parent
    }
    return this.defaultContext
  }
}
class ContextProvider<T>{
  constructor(
    public value: T,
    public parent: ContextFactory<T>
  ) { }
  changeValue(v: T) {
    if (this.value != v) {
      this.value = v
      this.notify()
    }
  }
  notify() {
    this.list.forEach(row => row.change())
  }
  private list = new Set<ContextListener<T, any>>()
  on(fun: ContextListener<T, any>) {
    if (this.list.has(fun)) {
      console.warn("已经存在相应函数", fun)
    } else {
      this.list.add(fun)
    }
  }
  off(fun: ContextListener<T, any>) {
    if (!this.list.delete(fun)) {
      console.warn("重复删除context", fun)
    }
  }
}

class ContextListener<T, M>{
  constructor(
    public context: ContextProvider<T>,
    private fiber: Fiber,
    public select: (v: T) => M,
    public shouldUpdate?: (a: M, b: M) => boolean
  ) {
    this.context.on(this)
  }
  public atom = createChangeAtom(this.select(this.context.value))
  getValue() {
    return this.atom.get()
  }
  change() {
    const newValue = this.select(this.context.value)
    const oldValue = this.atom.get()
    if (newValue != oldValue && this.didShouldUpdate(newValue, oldValue)) {
      this.atom.set(newValue)
      toWithDraftFiber(this.fiber)
    }
  }
  didShouldUpdate(a: M, b: M) {
    if (this.shouldUpdate) {
      draftFiber()
      const v = this.shouldUpdate(a, b)
      revertFiber()
      return v
    } else {
      return true
    }
  }
  destroy() {
    this.context.off(this)
  }
}