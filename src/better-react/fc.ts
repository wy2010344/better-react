import { Context, ContextProvider, Fiber, StoreValue } from "./Fiber"
import Better from "./index"
import { reconcile } from "./reconcile"
import { reconcileChildren } from "./reconcileChildren"

/**当前计算的hook节点 */
let wipFiber: Fiber | undefined = undefined
/**当前计算节点的hook下标 */
const hookIndex = {
  value: 0,
  effect: 0,
  ref: 0
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
  wipFiber.hooks = {
    value: [],
    effect: [],
    ref: [],
    contexts: fiber.props?.contexts
  }

  if (fiber.type == Better.createFragment) {
    reconcileChildren(fiber, fiber.props?.children)
  } else {
    const cs = fiber.type(fiber.props)
    console.log("cccss", cs)
    reconcileChildren(fiber, [cs])
  }
}

export function useValue<T>(init: () => T) {
  const hook = wipFiber?.alternate && wipFiber.alternate.hooks && wipFiber.alternate.hooks.value[hookIndex.value] || storeValue(init())
  hook.setFiber(wipFiber!)
  wipFiber!.hooks!.value.push(hook)
  hookIndex.value!++
  return hook.render as StoreValue<T>
}
export function useStateFrom<T>(init: () => T) {
  const hook = useValue(init)
  return [hook(), hook] as const
}
export function useState<T>(initial: T) {
  return useStateFrom(() => initial)
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

export function useRef<T>(init: T) {
  return useRefValue(() => init)
}

const DEFAULT_EFFECT = () => { }
export function useEffect(effects: () => (void | (() => void)), deps: any[]) {
  const hook = wipFiber?.alternate && wipFiber.alternate.hooks && wipFiber.alternate.hooks.effect[hookIndex.effect] || storeRef({
    effect: DEFAULT_EFFECT,
    deps: []
  }) as StoreValue<{
    deps: any[]
    effect: any
    destroy?(): void
  }>
  wipFiber!.hooks!.effect.push(hook)
  hookIndex.effect!++
  const last = hook()
  if (last.deps.length == deps.length && deps.every((v, i) => v == last.deps[i])) {
    //完全相同，不处理
    if (last.effect == DEFAULT_EFFECT) {
      //延迟到DOM元素数据化后初始化
      hook({
        deps,
        effect: effects,
      })
    }
  } else {
    last.destroy?.()
    hook({
      deps,
      effect: effects,
      destroy: effects() as undefined
    })
  }
}
export function useContext<T>(contextParent: ContextProvider<T>) {
  let currentFiber = wipFiber
  while (currentFiber) {
    const contexts = currentFiber?.hooks?.contexts
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



