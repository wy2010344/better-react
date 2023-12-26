/**
 * 传统组件变react
 * 不考虑react的异步.
 * 渲染到视图是异步的.
 * 如scrollTop是计算属性,是惰性计算.
 * 所以数据本身是实时的.模型即修改即更新.
 * 但如果计算属性依赖父容器组件等,则要立即render来获得最新的值.相当于flushSync.
 * 
 * 如果挂在类上面,当然计算属性的访问里面有触发flushSync.
 * 如果是函数组件,当然计算属性应该是一种函数,内部触发了flushSync,导致立即更新并计算到最终值.
 * 似乎函数组件仍然会方便很多.
 * 
 * 这种实时与jetpact compose结合?
 */

import { RenderWithDep, VirtaulDomNode, VirtualDomOperator, arrayEqual, arrayNotEqualDepsWithEmpty, quote, simpleEqual } from "better-react"
import { Fiber, HookContextCosumer, HookEffect, HookMemo, HookValue, HookValueOut } from "./Fiber"
import { EnvModel } from "./commitWork"




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


/**
 * 是否在render期间
 * @param envModel 
 * @returns 
 */
function isOnRender(envModel: EnvModel) {
  if (allowWipFiber) {
    return wipFiber[0] == envModel
  }
  return false
}

function notRenderRequestFlushSync(envModel: EnvModel) {
  /**
   * 不在render期间,则触发回流
   */
  if (!isOnRender(envModel)) {
    return false
  }
  envModel.requestFlushSync()
  return true
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

export function useModel<M, T>(initValue: M, initFun: (v: M) => T): HookValueOut<T>
export function useModel<T>(initValue: T, initFun?: (v: T) => T): HookValueOut<T>
/**
 * 一般可简单封装为[value,set,get]用于render
 * @param initValue 
 * @returns 
 */
export function useModel(initValue: any, initFun = quote) {
  const [envModel, parentFiber] = useParentFiber()
  const isInit = parentFiber.effectTag == "PLACEMENT"
  if (isInit) {
    const hookValues = parentFiber.hookValue || []
    parentFiber.hookValue = hookValues
    const hook: HookValue<any> = {
      value: initFun(initValue),
      out: [function () {
        return hook.value
      }, function (v) {
        if (v != hook.value) {
          //保持惰性更新
          envModel.requestRender()
          parentFiber.effectTag = "UPDATE"
          hook.value = v
        }
      }]
    }
    hookValues.push(hook)
    return hook.out
  } else {
    const hookValues = parentFiber.hookValue
    if (!hookValues) {
      throw new Error("原组件上不存在reducer")
    }
    const hook = hookValues[hookIndex.state]
    hookIndex.state++
    return hook.out
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
  effect: (args: T, isInit: boolean) => EffectResult<T>, deps: T): void
export function useLevelEffect(
  level: number,
  effect: () => EffectResult<any[]>,
  deps?: readonly any[]): void
export function useLevelEffect(
  level: number,
  effect: any, deps?: any) {
  const [envModel, parentFiber] = useParentFiber()
  const isInit = parentFiber.effectTag == 'PLACEMENT'
  if (isInit) {
    //新增
    const hookEffects = parentFiber.hookEffects || new Map()
    parentFiber.hookEffects = hookEffects
    const hook: HookEffect = {
      deps
    }
    const old = hookEffects.get(level)
    const array = old || []
    if (!old) {
      hookEffects.set(level, array)
    }
    array.push(hook)
    envModel.updateEffect(level, () => {
      hook.destroy = effect(deps, isInit)
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
    const hook = levelEffect[index]
    if (!hook) {
      throw new Error("出现了更多的effect")
    }
    hookIndex.effects.set(level, index + 1)
    if (arrayNotEqualDepsWithEmpty(hook.deps, deps)) {
      hook.deps = deps
      envModel.updateEffect(level, () => {
        if (hook.destroy) {
          hook.destroy(hook.deps)
        }
        hook.destroy = effect(deps, isInit)
      })
    }
  }
}
export function useComputed<T, V extends readonly any[] = readonly any[]>(
  effect: () => T
): () => T
/**
 * 一般可简单进一步封装[value,get]用于render
 * @param effect 
 * @param deps 
 * @returns 
 */
export function useComputed<T, V extends readonly any[] = readonly any[]>(
  effect: (deps: V) => T,
  getDeps: () => V
): () => T
export function useComputed<T>(
  effect: (deps?: any) => T,
  getDeps?: () => any
): () => T {
  const [envModel, parentFiber] = useParentFiber()
  const isInit = parentFiber.effectTag == "PLACEMENT"
  if (isInit) {
    const hookMemos = parentFiber.hookMemo || []
    parentFiber.hookMemo = hookMemos
    const item: HookMemo<T, any> = {
      effect,
      getDeps,
      getValue() {
        notRenderRequestFlushSync(envModel)
        const deps = getDeps?.()
        if (!deps || (deps && (!item.cachaValue || !arrayEqual(deps, item.cacheDeps as any, simpleEqual)))) {
          draftParentFiber()
          item.cachaValue = item.effect(deps!)
          revertParentFiber()
          item.cacheDeps = deps
        }
        return item.cachaValue!
      }
    }
    hookMemos.push(item)
    return item.getValue
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
    hook.getDeps = getDeps
    hook.effect = effect
    return hook.getValue
  }
}


export function renderBaseFiber<T extends readonly any[] = readonly any[]>(
  dom: VirtualDomOperator,
  ...vs: RenderWithDep<T>
): VirtaulDomNode
export function renderBaseFiber<T extends readonly any[] = readonly any[]>(
  dom: void,
  ...vs: RenderWithDep<T>
): void
export function renderBaseFiber(
  dom: any,
  render: any,
  deps?: any
): any {
  const [envModel, parentFiber] = useParentFiber()
  let currentFiber: Fiber
  const isInit = parentFiber.effectTag == 'PLACEMENT'
  if (isInit) {
    //新增
    const vdom = dom ? dom[0](dom[2]) : undefined
    currentFiber = Fiber.create(
      parentFiber,
      vdom,
      {
        render,
        deps
      })
    currentFiber.before = hookIndex.beforeFiber
    //第一次要标记sibling
    if (hookIndex.beforeFiber) {
      hookIndex.beforeFiber.next = (currentFiber)
    } else {
      parentFiber.firstChild = (currentFiber)
    }
    //一直组装到最后
    parentFiber.lastChild = (currentFiber)
    hookIndex.beforeFiber = currentFiber
  } else {
    //修改
    let oldFiber: Fiber | void = undefined
    if (hookIndex.beforeFiber) {
      oldFiber = hookIndex.beforeFiber.next
    }
    if (!oldFiber) {
      oldFiber = parentFiber.firstChild
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
  return renderBaseFiber(dom, render, deps)
}

export interface Context<T> {
  useProvider(v: T): void
  useSelector<M>(getValue: (v: T) => M, shouldUpdate?: (a: M, b: M) => boolean): () => M
  useConsumer(): () => T
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
  useSelector<M>(getValue: (v: T) => M, shouldUpdate?: (a: M, b: M) => any): () => M {
    const [envModel, parentFiber] = useParentFiber()
    const isInit = parentFiber.effectTag == "PLACEMENT"
    if (isInit) {
      const hookConsumers = parentFiber.hookContextCosumer || []
      parentFiber.hookContextCosumer = hookConsumers

      const hook: HookContextCosumer<T, M> = this.createConsumer(envModel, parentFiber, getValue, shouldUpdate)
      hookConsumers.push(hook)
      return hook.getValue
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
      return hook.getValue
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
    private envModel: EnvModel,
    public context: ContextProvider<T>,
    private fiber: Fiber,
    public select: (v: T) => M,
    public shouldUpdate?: (a: M, b: M) => boolean
  ) {
    this.context.on(this)
    this.value = this.getFilberValue()
    this.getValue = this.getValue.bind(this)
  }
  public value: M
  getValue() {
    return this.value
  }
  private getFilberValue() {
    draftParentFiber()
    const v = this.select(this.context.value)
    revertParentFiber()
    return v
  }
  change() {
    const newValue = this.getFilberValue()
    if (newValue != this.value && this.didShouldUpdate(newValue, this.value)) {
      this.value = newValue
      //即使子节点没有展开函数,也会触发到
      this.fiber.effectTag = "UPDATE"
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