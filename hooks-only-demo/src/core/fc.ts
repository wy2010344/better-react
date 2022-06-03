import { addAdd, addUpdate, updateEffect } from "./commitWork";
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

function getInit<T>(init: T | (() => T)) {
  if (typeof (init) == 'function') {
    return (init as any)()
  } else {
    return init
  }
}

export function useState<T>(init: T | (() => T)) {
  let hookValue: LinkValue<HookValue<T>>
  if (hookIndex.beforeValue) {
    const temp = hookIndex.beforeValue.next
    if (temp) {
      hookValue = temp
    } else {
      hookValue = {
        value: storeValue(getInit(init))
      }
      hookIndex.beforeValue.next = hookValue
    }
  } else {
    const temp = wipFiber?.hookValue
    if (temp) {
      hookValue = temp
    } else {
      hookValue = {
        value: storeValue(getInit(init))
      }
      wipFiber!.hookValue = hookValue
    }
  }
  hookIndex.beforeValue = hookValue

  hookValue.value.setFiber(wipFiber!)
  return [hookValue.value.get(), hookValue.value.set, hookValue.value.get] as const
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
        reconcile({
          beforeLoop() {
            fiber.effectTag = "DIRTY"
          },
          afterLoop: callback
        })
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
      if (!notEqual(a1[i], a2[i])) {
        return true
      }
    }
    return false
  }
  return true
}

const DEFAULT_EFFECT = () => { }
export function useEffect(effect: () => (void | (() => void)), deps?: readonly any[]) {
  let hookEffect: LinkValue<HookEffect>
  if (hookIndex.beforeEffect) {
    const temp = hookIndex.beforeEffect.next
    if (temp) {
      hookEffect = temp
    } else {
      hookEffect = {
        value: {
          effect: DEFAULT_EFFECT,
          deps: []
        }
      }
      hookIndex.beforeEffect.next = hookEffect
    }
  } else {
    const temp = wipFiber?.hookEffect
    if (temp) {
      hookEffect = temp
    } else {
      hookEffect = {
        value: {
          effect: DEFAULT_EFFECT,
          deps: []
        }
      }
      wipFiber!.hookEffect = hookEffect
    }
  }
  hookIndex.beforeEffect = hookEffect


  const last = hookEffect.value
  //hook都需要结束的时候才计算！！。
  if (Array.isArray(last.deps)
    && Array.isArray(deps)
    && arrayEqual(last.deps, deps, simpleEqual)) {
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
  if (hookIndex.beforeMemo) {
    const temp = hookIndex.beforeMemo.next
    if (temp) {
      hookMemo = temp
    } else {
      hookMemo = {
        value: {
          effect: DEFAULT_EFFECT,
          value: null,
          deps: []
        } as any
      }
      hookIndex.beforeMemo.next = hookMemo
    }
  } else {
    const temp = wipFiber?.hookMemo
    if (temp) {
      hookMemo = temp
    } else {
      hookMemo = {
        value: {
          effect: DEFAULT_EFFECT,
          value: null,
          deps: []
        } as any
      }
      wipFiber!.hookMemo = hookMemo
    }
  }
  hookIndex.beforeMemo = hookMemo

  const last = hookMemo.value
  if (arrayEqual(last.deps, deps, simpleEqual)) {
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

function propsShouldUpdate<T>(fiber: Fiber<T>, newP: T) {
  if (fiber.shouldUpdate) {
    return fiber.shouldUpdate(newP, fiber.props)
  } else {
    return fiber.props != newP
  }
}
export function useFiber<T>(
  callback: (fiber: Fiber<T>) => void,
  props: T,
  shouldUpdate?: (newP: T, oldP: T) => boolean
) {
  let hookFiber: Fiber | undefined
  if (hookIndex.beforeFiber) {
    const temp = hookIndex.beforeFiber.sibling
    if (temp) {
      hookFiber = temp
      const v = hookFiber.render != callback || hookFiber.shouldUpdate != shouldUpdate || propsShouldUpdate(hookFiber, props)
      //console.log("should-----Update", v)
      if (v) {
        hookFiber.render = callback
        hookFiber.props = props
        hookFiber.shouldUpdate = shouldUpdate
        hookFiber.effectTag = "UPDATE"
        addUpdate(hookFiber!)
      }
    } else {
      hookFiber = {
        render: callback,
        shouldUpdate,
        props,
        effectTag: "PLACEMENT",
        parent: wipFiber
      }
      addAdd(hookFiber)
      hookIndex.beforeFiber.sibling = hookFiber
    }
  } else {
    const temp = wipFiber?.child
    if (temp) {
      hookFiber = temp
      const v = hookFiber.render != callback || hookFiber.shouldUpdate != shouldUpdate || propsShouldUpdate(hookFiber, props)
      //console.log("shouldUpdate", v)
      if (v) {
        hookFiber.render = callback
        hookFiber.props = props
        hookFiber.shouldUpdate = shouldUpdate
        hookFiber.effectTag = "UPDATE"
        addUpdate(hookFiber!)
      }
    } else {
      hookFiber = {
        render: callback,
        shouldUpdate,
        props,
        effectTag: "PLACEMENT",
        parent: wipFiber
      }
      addAdd(hookFiber)
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
    if (wipFiber?.contextProvider) {
      map = wipFiber.contextProvider
    } else {
      map = new Map()
      wipFiber!.contextProvider = map
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
    if (hookIndex.beforeContextConsumer) {
      const temp = hookIndex.beforeContextConsumer.next
      if (temp) {
        hookConsumer = temp
      } else {
        hookConsumer = {
          value: this.createConsumer(wipFiber!)
        }
        hookIndex.beforeContextConsumer.next = hookConsumer
      }
    } else {
      const temp = wipFiber?.hookContextCosumer
      if (temp) {
        hookConsumer = temp
      } else {
        hookConsumer = {
          value: this.createConsumer(wipFiber!)
        }
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



