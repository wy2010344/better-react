import { addAdd, addDraftConsumer, addUpdate, ChangeAtomValue, createChangeAtom, updateEffect } from "./commitWork";
import { Fiber, fiberDataClone, findParentAndBefore, getData, getEditData, HookContextCosumer, HookEffect, HookValue, HookValueSet, isWithDraftFiber, StoreRef, WithDraftFiber } from "./Fiber";
import { reconcile } from "./reconcile";


let wipFiber: WithDraftFiber | undefined = undefined


const hookIndex = {
  state: 0,
  effect: 0,
  memo: 0,
  beforeFiber: undefined as (Fiber | undefined),
  cusomer: 0
}

export function updateFunctionComponent(fiber: WithDraftFiber) {
  wipFiber = fiber
  hookIndex.state = 0
  hookIndex.effect = 0
  hookIndex.memo = 0

  hookIndex.beforeFiber = undefined

  hookIndex.cusomer = 0
  fiber.draft.render(fiber)
  findParentAndBefore(fiber)
  wipFiber = undefined
}

function getInit<T>(init: T | (() => T)) {
  if (typeof (init) == 'function') {
    return (init as any)()
  } else {
    return init
  }
}
export function useState<S = undefined>(): [S | undefined, HookValueSet<S | undefined>];
export function useState<T>(init: T | (() => T)): [T, HookValueSet<T>];
export function useState() {
  const init = arguments[0]
  const currentFiber = wipFiber!
  if (currentFiber.effectTag == 'PLACEMENT') {
    //新增
    const hookValues = currentFiber.hookValue || []
    currentFiber.hookValue = hookValues
    const value = createChangeAtom(getInit(init))
    const hook: HookValue<any> = {
      value,
      set: buildSetValue(value, currentFiber)
    }
    hookValues.push(hook)
    return [value.get(), hook.set]
  } else {
    //修改
    const hookValues = currentFiber.hookValue
    if (!hookValues) {
      throw new Error("原组件上不存在state")
    }
    const hook = hookValues[hookIndex.state]
    if (!hook) {
      throw new Error("出现了更多的state")
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
 */
function buildSetValue<T>(atom: ChangeAtomValue<T>, fiber: Fiber) {
  return function set(temp: T | ((v: T) => T), after?: (v: T) => void) {
    reconcile({
      beforeLoop() {
        toWithDraftFiber(fiber)
        //这里如果多次设置值,则会改动多次,依前一次结果累积.
        const oldValue = atom.get()
        const newValue = typeof (temp) == 'function' ? (temp as any)(oldValue) : temp as T
        atom.set(newValue)
      },
      afterLoop: after ? () => {
        after(atom.get())
      } : undefined
    })
  }
}

export function toWithDraftFiber<V>(fiber: Fiber<V>): WithDraftFiber<V> {
  const nFiber = fiber as any
  if (!nFiber.effectTag) {
    nFiber.effectTag = "UPDATE"
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
export function simpleNotEqual<T>(a: T, b: T) {
  return a != b
}
export function arrayNotEqual<T>(a1: readonly T[], a2: readonly T[], notEqual: (x: T, y: T) => boolean) {
  if (a1 == a2) {
    return false
  }
  const len = a1.length
  if (a2.length == len) {
    for (let i = 0; i < len; i++) {
      if (notEqual(a1[i], a2[i])) {
        return true
      }
    }
    return false
  }
  return true
}
export function useEffect(effect: () => (void | (() => void)), deps?: readonly any[]) {
  const currentFiber = wipFiber!
  if (currentFiber.effectTag == 'PLACEMENT') {
    //新增
    const hookEffects = currentFiber.hookEffect || []
    currentFiber.hookEffect = hookEffects
    const state: HookEffect = {
      deps
    }
    const hookEffect = createChangeAtom(state)
    hookEffects.push(hookEffect)
    updateEffect(() => {
      state.destroy = effect()
    })
  } else {
    const hookEffects = currentFiber.hookEffect
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
    if (Array.isArray(state.deps)
      && Array.isArray(deps)
      && arrayEqual(state.deps, deps, simpleEqual)) {
      //不处理
    } else {
      const newState: HookEffect = {
        deps
      }
      hookEffect.set(newState)
      updateEffect(() => {
        if (state.destroy) {
          state.destroy()
        }
        newState.destroy = effect()
      })
    }
  }
}

export function useMemo<T>(effect: () => T, deps: readonly any[]): T {
  const currentFiber = wipFiber!
  if (currentFiber.effectTag == "PLACEMENT") {
    const hookMemos = currentFiber.hookMemo || []
    currentFiber.hookMemo = hookMemos
    const state = {
      value: effect(),
      deps
    }
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
      const newState = {
        value: effect(),
        deps
      }
      hook.set(newState)
      return newState.value
    }
  }
}

function defaultShouldUpdate<T>(a: T, b: T) {
  return true
}
export function useFiber<T>(
  render: (fiber: WithDraftFiber<T>) => void,
  props: T,
  shouldUpdate: (a: T, b: T) => boolean = defaultShouldUpdate
): Fiber<T> {
  const currentFiber = wipFiber!
  if (currentFiber.effectTag == 'PLACEMENT') {
    //新增
    const hook: Fiber<T> = {
      effectTag: "PLACEMENT",
      parent: currentFiber,
      draft: {
        render,
        props,
        shouldUpdate,
        prev: hookIndex.beforeFiber
      }
    }
    addAdd(hook)

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
      oldFiber = wipFiber?.draft.child
    }
    if (!oldFiber) {
      throw new Error("非预期地多出现了fiter")
    }
    hookIndex.beforeFiber = oldFiber
    if (isWithDraftFiber(oldFiber)) {
      //已经被标记为脏
      oldFiber.draft.render = render
      oldFiber.draft.props = props
      oldFiber.draft.shouldUpdate = shouldUpdate
      addUpdate(oldFiber)
    } else {
      const oldProps = oldFiber.current.props
      if (oldFiber.current.render != render
        || oldFiber.current.shouldUpdate != shouldUpdate
        || (props != oldProps && oldFiber.current.shouldUpdate(props, oldProps))
      ) {
        //检查出来需要更新
        const draft = fiberDataClone(oldFiber.current)
        draft.render = render
        draft.props = props
        draft.shouldUpdate = shouldUpdate
        const nOldFiber = oldFiber as any
        nOldFiber.effectTag = "UPDATE"
        nOldFiber.draft = draft
        addUpdate(oldFiber)
      }
    }
    return oldFiber
  }
}

export interface Context<T> {
  useProvider(v: T): void
  useSelector<M>(getValue: (v: T) => M, shouldUpdate?: (a: M, b: M) => boolean): M
  useConsumer(): T
}
function quote<T>(v: T) { return v }
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
    const currentFiber = wipFiber!
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
  useSelector<M>(getValue: (v: T) => M, shouldUpdate?: (a: M, b: M) => boolean): M {
    const currentFiber = wipFiber!
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
      return this.shouldUpdate(a, b)
    } else {
      return true
    }
  }
  destroy() {
    this.context.off(this)
  }
}