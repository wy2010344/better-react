import { updateEffect } from "./commitWork"
import { ContextProvider, Fiber, StoreValue } from "./Fiber"
import { Fragment } from "./index"
import { reconcile } from "./reconcile"
import { reconcileChildren } from "./reconcileChildren"
/**当前计算的hook节点 */
let wipFiber: Fiber | undefined = undefined
/**当前计算节点的hook下标 */
const hookIndex = {
  value: 0,
  effect: 0,
  ref: 0,
  memo: 0
}
/**
 * 更新函数式组件
 * @param fiber 
 */
export function updateFunctionComponent(fiber: Fiber) {
  if (fiber.type == Fragment) {
    //是fragment
    reconcileChildren(fiber, fiber.props?.children)
  } else if (fiber.type == reconcileChildren) {
    //是数组
    reconcileChildren(fiber, fiber.props?.children)
  } else {
    wipFiber = fiber
    hookIndex.value = 0
    hookIndex.effect = 0
    hookIndex.ref = 0
    hookIndex.memo = 0
    wipFiber.hooks = {
      value: [],
      effect: [],
      ref: [],
      memo: []
    }
    if (fiber.dom) {
      fiber.dom.reconcile()
    }
    reconcileChildren(fiber, fiber.render(fiber))
  }
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
        if (temp != value) {
          value = temp
          fiber.effectTag = "DIRTY"
          reconcile()
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
  return hook as StoreValue<T>
}

const DEFAULT_EFFECT = () => { }
export function useEffect(effects: () => (void | (() => void)), deps?: readonly any[]) {
  const hook = wipFiber?.alternate && wipFiber.alternate.hooks && wipFiber.alternate.hooks.effect[hookIndex.effect] || storeRef({
    effect: DEFAULT_EFFECT,
    deps: []
  }) as StoreValue<{
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
  }) as StoreValue<{
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
export function findContext<T>(contextParent: ContextProvider<T>): T {
  let currentFiber = wipFiber
  while (currentFiber) {
    const contexts = currentFiber?.props?.contexts
    if (contexts) {
      for (let i = 0; i < contexts.length; i++) {
        const context = contexts[i]
        if (context.parent.id == contextParent.id) {
          return context.value
        }
      }
    }
    currentFiber = currentFiber?.parent
  }
  return contextParent.out
}



