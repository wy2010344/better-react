import { StoreRef, EnvModel, UpdateEffectLevel } from "./commitWork";
import { Fiber, HookContextCosumer, HookEffect, HookValue, HookValueSet, RenderWithDep, VirtaulDomNode, VirtualDomOperator } from "./Fiber";
import { arrayEqual, arrayNotEqualDepsWithEmpty, quote, simpleEqual } from "./util";


const wipFiber: [EnvModel, Fiber] = [] as any
export function useParentFiber() {
  if (allowWipFiber) {
    return wipFiber
  }
  console.error('禁止在此处访问fiber')
  throw new Error('禁止在此处访问fiber')
}

let allowWipFiber = false
export function draftParentFiber() {
  allowWipFiber = false
}
export function revertParentFiber() {
  allowWipFiber = true
}
const hookIndex = {
  state: 0,
  effects: new Map<number, number>(),
  memo: 0,
  beforeFiber: undefined as (Fiber | undefined),
  cusomer: 0
}

export function updateFunctionComponent(envModel: EnvModel, fiber: Fiber) {
  revertParentFiber()
  wipFiber[0] = envModel
  wipFiber[1] = fiber

  hookIndex.state = 0
  hookIndex.effects.clear()
  hookIndex.memo = 0

  hookIndex.beforeFiber = undefined

  hookIndex.cusomer = 0
  fiber.render()
  draftParentFiber()
}

export type ReducerFun<F, T> = (old: T, action: F) => T
export type ReducerResult<F, T> = [T, HookValueSet<F>];

/**
 * 依赖外部初始值
 * 也有只依赖一个函数,则值为常值如0,另作一个封装
 * @param reducer 
 * @param v 
 * @param init 
 */
export function useBaseReducer<F, M, T>(reducer: ReducerFun<F, T>, init: M, initFun: (m: M) => T): ReducerResult<F, T>
export function useBaseReducer<F, T>(reducer: ReducerFun<F, T>, init: T, initFun?: (m: T) => T): ReducerResult<F, T>
export function useBaseReducer<F, T = undefined>(reducer: ReducerFun<F, T>, init?: T, initFun?: (m: T) => T): ReducerResult<F, T>
export function useBaseReducer() {
  const [reducer, init, initFun] = arguments
  const [envModel, parentFiber] = useParentFiber()
  if (parentFiber.effectTag.get() == 'PLACEMENT') {
    //新增
    const hookValues = parentFiber.hookValue || []
    parentFiber.hookValue = hookValues
    const trans = initFun || quote
    const value = envModel.createChangeAtom(trans(init))
    const hook: HookValue<any, any> = {
      value,
      set: buildSetValue(value, envModel, parentFiber, reducer),
      reducer,
      init,
      initFun
    }
    hookValues.push(hook)
    return [value.get(), hook.set]
  } else {
    //修改
    const hookValues = parentFiber.hookValue
    if (!hookValues) {
      throw new Error("原组件上不存在reducer")
    }
    const hook = hookValues[hookIndex.state]
    if (!hook) {
      throw new Error("出现了更多的reducer")
    }
    if (hook.reducer != reducer) {
      console.warn("useReducer的reducer变化")
    }
    // if (hook.init != init) {
    //   console.warn("useReducer的init变化")
    // }
    // if (hook.initFun != initFun) {
    //   console.warn("useReducer的initFun变化")
    // }
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
function buildSetValue<T, F>(atom: StoreRef<T>,
  envModel: EnvModel,
  parentFiber: Fiber,
  reducer: (old: T, action: F) => T
) {
  return function (temp: F) {
    if (parentFiber.destroyed) {
      console.log("更新已经销毁的fiber")
      return
    }
    envModel.reconcile(function () {
      //这里如果多次设置值,则会改动多次,依前一次结果累积.
      const oldValue = atom.get()
      const newValue = reducer(oldValue, temp)
      if (newValue != oldValue) {
        parentFiber.effectTag.set("UPDATE")
        atom.set(newValue)
      }
    })
  }
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
  effect: (args: T) => EffectResult<T>, deps: T): void
export function useLevelEffect(
  level: number,
  effect: () => EffectResult<any[]>,
  deps?: readonly any[]): void
export function useLevelEffect(
  level: number,
  effect: any, deps?: any) {
  const [envModel, parentFiber] = useParentFiber()
  if (parentFiber.effectTag.get() == 'PLACEMENT') {
    //新增
    const hookEffects = parentFiber.hookEffects || new Map()
    parentFiber.hookEffects = hookEffects
    const state: HookEffect = {
      deps
    }
    const hookEffect = envModel.createChangeAtom(state)
    const old = hookEffects.get(level)
    const array = old || []
    if (!old) {
      hookEffects.set(level, array)
    }
    array.push(hookEffect)
    envModel.updateEffect(level, () => {
      state.destroy = effect(deps)
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
      envModel.updateEffect(level, () => {
        if (state.destroy) {
          state.destroy(state.deps)
        }
        newState.destroy = effect(deps)
      })
    }
  }
}

export function useGetCreateChangeAtom() {
  const [envModel] = useParentFiber()
  return envModel.createChangeAtom
}
/**
 * 通过返回函数,能始终通过函数访问fiber上的最新值
 * @param effect 
 * @param deps 
 * @returns 
 */
export function useBaseMemoGet<T, V extends readonly any[] = readonly any[]>(
  effect: (deps: V) => T,
  deps: V,
): () => T {
  const [envModel, parentFiber] = useParentFiber()
  if (parentFiber.effectTag.get() == "PLACEMENT") {
    const hookMemos = parentFiber.hookMemo || []
    parentFiber.hookMemo = hookMemos

    draftParentFiber()
    const state = {
      value: effect(deps),
      deps,
    }
    revertParentFiber()

    const hook = envModel.createChangeAtom(state)
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
        value: effect(deps),
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
  const [envModel, parentFiber] = useParentFiber()
  let currentFiber: Fiber
  if (parentFiber.effectTag.get() == 'PLACEMENT') {
    //新增
    const vdom = dom ? dom[0](dom[2]) : undefined
    currentFiber = Fiber.createFix(
      envModel,
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
    currentDom.useUpdate(dom[1])
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
  useProvider(v: T): void
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
    this.defaultContext = this.createProvider(out)
  }

  private readonly defaultContext: ContextProvider<T>
  private createProvider(value: T): ContextProvider<T> {
    return new ContextProvider(value, this)
  }
  private createConsumer<M>(
    envModel: EnvModel,
    fiber: Fiber,
    getValue: (v: T) => M,
    shouldUpdate?: (a: M, b: M) => boolean
  ): ContextListener<T, M> {
    return new ContextListener(
      envModel,
      this.findProvider(fiber),
      fiber,
      getValue,
      shouldUpdate
    )
  }
  useProvider(v: T) {
    const [envModel, parentFiber] = useParentFiber()
    const map = parentFiber.contextProvider || new Map()
    parentFiber.contextProvider = map
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
    const [envModel, parentFiber] = useParentFiber()
    if (parentFiber.effectTag.get() == "PLACEMENT") {
      const hookConsumers = parentFiber.hookContextCosumer || []
      parentFiber.hookContextCosumer = hookConsumers

      const hook: HookContextCosumer<T, M> = this.createConsumer(envModel, parentFiber, getValue, shouldUpdate)
      hookConsumers.push(hook)
      envModel.addDraftConsumer(hook)
      //如果draft废弃,需要移除该hook
      return hook.getValue()
    } else {
      const hookConsumers = parentFiber.hookContextCosumer
      if (!hookConsumers) {
        throw new Error("原组件上不存在hookConsumers")
      }
      const index = hookIndex.cusomer
      const hook = hookConsumers[index]
      if (!hook) {
        throw new Error("没有出现更多consumes")
      }
      if (hook.select != getValue) {
        console.warn("useSelector的select变化")
      }
      if (hook.shouldUpdate != shouldUpdate) {
        console.warn("useSelector的shouldUpdate变化")
      }
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
      //throw new Error('重复删除debug')
    }
  }
}

class ContextListener<T, M>{
  constructor(
    envModel: EnvModel,
    public context: ContextProvider<T>,
    private fiber: Fiber,
    public select: (v: T) => M,
    public shouldUpdate?: (a: M, b: M) => boolean
  ) {
    this.context.on(this)
    this.atom = envModel.createChangeAtom(this.getFilberValue())
  }
  public atom: StoreRef<M>
  getValue() {
    return this.atom.get()
  }
  private getFilberValue() {
    draftParentFiber()
    const v = this.select(this.context.value)
    revertParentFiber()
    return v
  }
  change() {
    const newValue = this.getFilberValue()
    const oldValue = this.atom.get()
    if (newValue != oldValue && this.didShouldUpdate(newValue, oldValue)) {
      this.atom.set(newValue)
      this.fiber.effectTag.set("UPDATE")
    }
  }
  didShouldUpdate(a: M, b: M) {
    if (this.shouldUpdate) {
      draftParentFiber()
      const v = this.shouldUpdate(a, b)
      revertParentFiber()
      return v
    } else {
      return true
    }
  }
  destroy() {
    this.context.off(this)
  }
}


export function useGetFlushSync() {
  const [envModel] = useParentFiber()
  return envModel.flushSync
}