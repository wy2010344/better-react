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
  ref: 0,
  memo: 0,
  contextProvider: 0,
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
  hookIndex.ref = 0
  hookIndex.memo = 0
  hookIndex.contextProvider = 0
  hookIndex.contextConsumer = 0
  wipFiber.hooks = {
    value: [],
    effect: [],
    ref: [],
    memo: [],
    contextProvider: [],
    contextCosumer: []
  }
  wipFiber = undefined
  reconcileChildren(fiber, fiber.render(fiber))
}

export function useValue<T>(init: () => T) {
  const hook = wipFiber?.alternate && wipFiber.alternate.hooks && wipFiber.alternate.hooks.value[hookIndex.value] || storeValue(init())
  hook.setFiber(wipFiber!)
  wipFiber!.hooks!.value.push(hook)
  hookIndex.value!++
  return hook.render as StoreValue<T>
}

function storeValue<T>(value: T) {
  let fiber: Fiber
  return {
    setFiber(v: Fiber) {
      fiber = v
    },
    render() {
      if (arguments.length == 0) {
        return value
      } else {
        const temp = arguments[0]
        const callback = arguments[1]
        if (temp == value) {
          if (callback) {
            callback()
          }
        } else {
          value = temp
          fiber.effectTag = "DIRTY"
          return reconcile(callback)
        }
      }
    }
  }
}

function storeRef<T>(value: T) {
  return function () {
    if (arguments.length == 0) {
      return value
    } else {
      value = arguments[0]
    }
  }
}

export function useRefValue<T>(init: () => T) {
  const hook = wipFiber?.alternate && wipFiber.alternate.hooks && wipFiber.alternate.hooks.ref[hookIndex.ref] || storeRef(init())
  wipFiber!.hooks!.ref.push(hook)
  hookIndex.ref!++
  return hook as StoreRef<T>
}

const DEFAULT_EFFECT = () => { }
export function useEffect(effects: () => (void | (() => void)), deps?: readonly any[]) {
  const hook = wipFiber?.alternate && wipFiber.alternate.hooks && wipFiber.alternate.hooks.effect[hookIndex.effect] || storeRef({
    effect: DEFAULT_EFFECT,
    deps: []
  }) as StoreRef<{
    deps?: any[]
    effect: any
    destroy?(): void
  }>
  wipFiber!.hooks!.effect.push(hook)
  hookIndex.effect++
  const last = hook()

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
        effects,
        destroy: undefined
      }
      hook(nextHook as any)
      updateEffect(() => {
        nextHook.destroy = effects() as undefined
      })
    }
  } else {
    const nextHook = {
      deps,
      effects,
      destroy: undefined
    }
    hook(nextHook as any)
    updateEffect(() => {
      last.destroy?.()
      nextHook.destroy = effects() as undefined
    })
  }
}

export function useMemo<T>(effect: () => T, deps: readonly any[]) {
  const hook = wipFiber?.alternate && wipFiber.alternate.hooks && wipFiber.alternate.hooks.memo[hookIndex.memo] || storeRef({
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
  const last = hook()
  if (last.deps.length == deps.length && deps.every((v, i) => v == last.deps![i])) {
    //完全相同，不处理
    if (last.effect == DEFAULT_EFFECT) {
      //第一次，要处理
      const value = effect()
      hook({
        deps,
        effect,
        value
      })
      return value
    } else {
      //返回上一次结果
      return hook().value
    }
  } else {
    const value = effect()
    hook({
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
    const hook = wipFiber?.alternate?.hooks?.contextProvider[hookIndex.contextProvider] || storeRef(this.createProvider(v)) as StoreRef<ContextProvider<T>>
    wipFiber?.hooks?.contextProvider.push(hook)
    hookIndex.contextProvider++
    const last = hook()
    last.changeValue(v)
  }
  useConsumer() {
    const hook = wipFiber?.alternate?.hooks?.contextCosumer[hookIndex.contextConsumer] || storeRef(this.createConsumer(wipFiber!)) as StoreRef<{
      setFiber(v: Fiber): void
      getValue(): T
      destroy(): void
    }>
    wipFiber?.hooks?.contextCosumer.push(hook)
    hookIndex.contextConsumer++
    const last = hook()
    last.setFiber(wipFiber!)
    return last.getValue()
  }
  private findProvider(_fiber: Fiber) {
    let fiber = _fiber as Fiber | undefined
    while (fiber) {
      if (fiber.hooks) {
        const providers = fiber.hooks.contextProvider
        for (let i = 0; i < providers.length; i++) {
          const provider = providers[i]() as ContextProvider<T>
          if (provider.parent == this) {
            return provider
          }
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

/**
 * 不再使用这个
 * @param contextParent
 * @returns
 */
// export function findContext<T>(contextParent: ContextProvider<T>): T {
//   let currentFiber = wipFiber
//   while (currentFiber) {
//     const contexts = currentFiber?.props?.contexts
//     if (contexts) {
//       for (let i = 0; i < contexts.length; i++) {
//         const context = contexts[i]
//         if (context.parent.id == contextParent.id) {
//           return context.value
//         }
//       }
//     }
//     currentFiber = currentFiber?.parent
//   }
//   return contextParent.out
// }



