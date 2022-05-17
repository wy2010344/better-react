import { updateEffect } from "./commitWork";
import { Fiber, HookContextCosumer, HookEffect, HookMemo, HookValue, LinkValue, StoreRef, StoreValue } from "./Fiber";
import { reconcile } from "./reconcile";


let wipFiber: Fiber | undefined = undefined


const hookIndex = {
  beforeValue: undefined as (LinkValue<HookValue<any>> | undefined),
  beforeEffect: undefined as (LinkValue<HookEffect> | undefined),
  beforeMemo: undefined as (LinkValue<HookMemo<any>> | undefined),
  beforeFiber: undefined as (Fiber | undefined),
  beforeContextConsumer: undefined as (LinkValue<HookContextCosumer> | undefined)
}

export function updateFunctionComponent(fiber: Fiber) {
  wipFiber = fiber
  hookIndex.beforeValue = undefined
  hookIndex.beforeEffect = undefined
  hookIndex.beforeMemo = undefined
  hookIndex.beforeFiber = undefined
  hookIndex.beforeContextConsumer = undefined
  fiber.render(fiber)
  wipFiber = undefined
}


export function useValue<T>(init: () => T) {
  let hookValue: LinkValue<HookValue<T>>
  if (wipFiber?.alternate) {
    if (hookIndex.beforeValue) {
      hookValue = hookIndex.beforeValue.next!
    } else {
      hookValue = wipFiber.hookValue!
    }
  } else {
    hookValue = {
      value: storeValue(init())
    }
    if (hookIndex.beforeValue) {
      hookIndex.beforeValue.next = hookValue
    } else {
      wipFiber!.hookValue = hookValue
    }
  }
  hookIndex.beforeValue = hookValue

  hookValue.value.setFiber(wipFiber!)
  return [hookValue.value.get, hookValue.value.set]
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
  let hookEffect: LinkValue<HookEffect>
  if (wipFiber?.alternate) {
    if (hookIndex.beforeEffect) {
      hookEffect = hookIndex.beforeEffect.next!
    } else {
      hookEffect = wipFiber.hookEffect!
    }
  } else {
    hookEffect = {
      value: {
        effect: DEFAULT_EFFECT,
        deps: []
      }
    }
    if (hookIndex.beforeEffect) {
      hookIndex.beforeEffect.next = hookEffect
    } else {
      wipFiber!.hookEffect = hookEffect
    }
  }
  hookIndex.beforeEffect = hookEffect
  const last = hookEffect.value
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
      hookEffect.value = nextHook
      updateEffect(() => {
        nextHook.destroy = effect() as undefined
      })
    }
  } else {
    const nextHook = {
      deps,
      effect: effect,
      destroy: undefined
    }
    hookEffect.value = nextHook
    updateEffect(() => {
      last.destroy?.()
      nextHook.destroy = effect() as undefined
    })
  }
}

export function useMemo<T>(effect: () => T, deps: readonly any[]): T {
  let hookMemo: LinkValue<HookMemo<T>>
  if (wipFiber?.alternate) {
    if (hookIndex.beforeMemo) {
      hookMemo = hookIndex.beforeMemo.next!
    } else {
      hookMemo = wipFiber.hookMemo!
    }
  } else {
    hookMemo = {
      value: {
        effect: DEFAULT_EFFECT,
        value: null,
        deps: []
      } as any
    }
    if (hookIndex.beforeMemo) {
      hookIndex.beforeMemo.next = hookMemo
    } else {
      wipFiber!.hookMemo = hookMemo
    }
  }
  hookIndex.beforeMemo = hookMemo
  const last = hookMemo.value
  if (last.deps.length == deps.length && deps.every((v, i) => v == last.deps![i])) {
    //完全相同，不处理
    if (last.effect == DEFAULT_EFFECT) {
      //第一次，要处理
      const value = effect()
      hookMemo.value = {
        deps,
        effect,
        value
      }
      return value
    } else {
      //返回上一次结果
      return hookMemo.value.value
    }
  } else {
    const value = effect()
    hookMemo.value = {
      deps,
      effect,
      value
    }
    return value
  }
}

export function useFiber<T>(callback: (fiber: Fiber) => void, props: T) {
  let hookFiber: Fiber | undefined
  if (wipFiber?.alternate) {
    //有旧节点
    if (hookIndex.beforeFiber) {
      hookFiber = hookIndex.beforeFiber.sibling
    } else {
      hookFiber = wipFiber.alternate.child
    }
  } else {
    //无旧节点,创建新节点
    hookFiber = {
      render: callback,
      props
    }
    if (hookIndex.beforeFiber) {
      hookIndex.beforeFiber.sibling = hookFiber
    } else {
      wipFiber!.child = hookFiber
    }
  }
  hookIndex.beforeFiber = hookFiber
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
    let map: Map<any, {
      changeValue(v: any): void
    }>
    if (wipFiber?.alternate) {
      map = wipFiber.alternate.contextProvider!
    } else {
      if (wipFiber?.contextProvider) {
        map = wipFiber.contextProvider
      } else {
        map = new Map()
        wipFiber!.contextProvider = map
      }
    }
    let hook = map.get(this)
    if (!hook) {
      hook = this.createProvider(v)
      map.set(this, hook)
    }
    hook.changeValue(v)
  }
  useConsumer() {
    let hookConsumer: LinkValue<HookContextCosumer>
    if (wipFiber?.alternate) {
      if (hookIndex.beforeContextConsumer) {
        hookConsumer = hookIndex.beforeContextConsumer.next!
      } else {
        hookConsumer = wipFiber.hookContextCosumer!
      }
    } else {
      hookConsumer = {
        value: this.createConsumer(wipFiber!)
      }
      if (hookIndex.beforeContextConsumer) {
        hookIndex.beforeContextConsumer.next = hookConsumer
      } else {
        wipFiber!.hookContextCosumer = hookConsumer
      }
    }
    hookIndex.beforeContextConsumer = hookConsumer
    const hook = hookConsumer.value
    hook.setFiber(wipFiber!)
    return hook.getValue()
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



