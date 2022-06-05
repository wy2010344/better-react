import { Fiber, FiberId, insertFiber, selectOneFiber } from "./Fiber";



let wipFiber: Fiber<any> | undefined = undefined

const hookIndex = {
  beforeFiber: undefined as (FiberId | undefined)
}
export function updateFunctionComponent(fiber: Fiber<any>) {
  wipFiber = fiber
  hookIndex.beforeFiber = undefined
  fiber.render(fiber)
  wipFiber = undefined
}

function defaultShouldUpdate<T>(a: T, b: T) {
  return a != b
}
export function useFiber<T>(
  render: (fiber: Fiber<T>) => void,
  props: T,
  shouldUpdate = defaultShouldUpdate
) {
  let hookFiber
  if (hookIndex.beforeFiber) {
    const beforeId = hookIndex.beforeFiber
    const temp = selectOneFiber(v => v.before == beforeId)
    if (temp) {
      //有后继节点
      if (temp.render != render
        || temp.shouldUpdate != shouldUpdate
        || temp.shouldUpdate(props, temp.props)) {
        insertFiber({
          id: temp.id,
          render,
          props,
          shouldUpdate,
          parent: temp.parent,
          before: temp.before,
          effectTag: "UPDATE"
        })
      } else {
        insertFiber({
          id: FiberId.create(),
          render,
          props,
          shouldUpdate,
          parent: wipFiber?.id,
          before: beforeId,
          effectTag: "PLACEMENT"
        })
      }
    } else {
      //每次遍历,成本还挺大的.
      //不存在后继节点
      const id = wipFiber?.id!
      //找到第一个节点
      const temp = selectOneFiber(v => v.parent == id && !v.before)
    }
  }
}