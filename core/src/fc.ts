import { updateEffect } from "./commitWork"
import { Fiber, StoreRef, StoreValue } from "./Fiber"
import { reconcile } from "./reconcile"
import { reconcileChildren } from "./reconcileChildren"
/**当前计算的hook节点 */
let wipFiber: Fiber | undefined = undefined
/**当前计算节点的hook下标 */
const hookIndex = {
  value: 0,
  effect: 0,
  memo: 0,
  contextConsumer: 0
}
/**
 * 更新函数式组件
 * @param fiber 
 */
export function updateFunctionComponent(fiber: Fiber) {
  wipFiber = fiber
  hookIndex.value = 0
  hookIndex.effect = 0
  hookIndex.memo = 0
  hookIndex.contextConsumer = 0
  wipFiber.hooks = {
    value: [],
    effect: [],
    memo: [],
    contextProvider: new Map(),
    contextCosumer: []
  }
  const children = fiber.render(fiber)
  wipFiber = undefined
  reconcileChildren(fiber, children)
}

export function useValue<T>(init: () => T) {
  const hook = (wipFiber!.alternate?.hooks!.value[hookIndex.value] || storeValue(init())) as StoreValue<T>
  hook.setFiber(wipFiber!)
  wipFiber!.hooks!.value.push(hook)
  hookIndex.value++
  return [hook.get, hook.set]
}

function storeValue<T>(value: T) {
  let fiber: Fiber
  return {
    setFiber(v: Fiber) {
      fiber = v
    },
    get() {
      return value
    },
    set(temp: T, callback?: () => void) {
      if (temp == value) {
        if (callback) {
          callback()
        }
      } else {
        value = temp
        fiber.effectTag = "DIRTY"
        reconcile(callback)
      }
    }
  }
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

const DEFAULT_EFFECT = () => { }
export function useEffect(effect: () => (void | (() => void)), deps?: readonly any[]) {
  const hook = wipFiber!.alternate?.hooks!.effect[hookIndex.effect] || storeRef({
    effect: DEFAULT_EFFECT,
    deps: []
  }) as StoreRef<{
    deps?: any[]
    effect: any
    destroy?(): void
  }>
  wipFiber!.hooks!.effect.push(hook)
  hookIndex.effect++
  const last = hook.get()
  //hook都需要结束的时候才计算！！。
  if (Array.isArray(last.deps)
    && Array.isArray(deps)
    && last.deps.length == deps.length
    && deps.every((v, i) => v == last.deps![i])) {
    //完全相同，不处理
    if (last.effect == DEFAULT_EFFECT) {
      //延迟到DOM元素数据化后初始化
      const nextHook = {
        deps,
        effect,
        destroy: undefined
      }
      hook.set(nextHook as any)
      updateEffect(() => {
        nextHook.destroy = effect() as undefined
      })
    }
  } else {
    const nextHook = {
      deps,
      effect,
      destroy: undefined
    }
    hook.set(nextHook as any)
    updateEffect(() => {
      last.destroy?.()
      nextHook.destroy = effect() as undefined
    })
  }
}

export function useMemo<T>(effect: () => T, deps: readonly any[]): T {
  const hook = wipFiber?.alternate?.hooks?.memo[hookIndex.memo] || storeRef({
    effect: DEFAULT_EFFECT,
    value: null,
    deps: []
  }) as StoreRef<{
    deps: readonly any[]
    value: any
    effect: any
  }>
  wipFiber!.hooks!.memo.push(hook)
  hookIndex.memo++
  const last = hook.get()
  if (last.deps.length == deps.length && deps.every((v, i) => v == last.deps![i])) {
    //完全相同，不处理
    if (last.effect == DEFAULT_EFFECT) {
      //第一次，要处理
      const value = effect()
      hook.set({
        deps,
        effect,
        value
      })
      return value
    } else {
      //返回上一次结果
      return hook.get().value
    }
  } else {
    const value = effect()
    hook.set({
      deps,
      effect,
      value
    })
    return value
  }
}

export interface Context<T> {
  useProvider(v: T): void
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
  private createConsumer(fiber: Fiber): ContextListener<T> {
    return new ContextListener(this.findProvider(fiber), fiber)
  }
  useProvider(v: T) {
    const hook = wipFiber?.alternate?.hooks?.contextProvider.get(this) || this.createProvider(v)
    wipFiber?.hooks?.contextProvider.set(this, hook)
    hook.changeValue(v)
  }
  useConsumer() {
    const hook = wipFiber?.alternate?.hooks?.contextCosumer[hookIndex.contextConsumer] || this.createConsumer(wipFiber!) as {
      setFiber(v: Fiber): void
      getValue(): T
      destroy(): void
    }
    wipFiber?.hooks?.contextCosumer.push(hook)
    hookIndex.contextConsumer++
    hook.setFiber(wipFiber!)
    return hook.getValue()
  }
  private findProvider(_fiber: Fiber) {
    let fiber = _fiber as Fiber | undefined
    while (fiber) {
      if (fiber.hooks) {
        const providers = fiber.hooks.contextProvider
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
    this.value = v
    this.notify()
  }
  notify() {
    this.list.forEach(row => row.change())
  }
  private list = new Set<ContextListener<T>>()
  on(fun: ContextListener<T>) {
    if (this.list.has(fun)) {
      console.warn("已经存在相应函数", fun)
    } else {
      this.list.add(fun)
    }
  }
  off(fun: ContextListener<T>) {
    if (!this.list.delete(fun)) {
      console.warn("重复删除context", fun)
    }
  }
}

class ContextListener<T>{
  constructor(
    public context: ContextProvider<T>,
    private fiber: Fiber,
  ) {
    this.context.on(this)
  }
  getValue() {
    return this.context.value
  }
  setFiber(fiber: Fiber) {
    this.fiber = fiber
  }
  change() {
    this.fiber.effectTag = "DIRTY"
  }
  destroy() {
    this.context.off(this)
  }
}


