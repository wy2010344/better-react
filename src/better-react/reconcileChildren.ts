import { addAdd, addDelect, addUpdate } from "./commitWork"
import { Fiber } from "./Fiber"

/**
 * 更新子节点为新的计算后的fiber
 * @param fiber 
 * @param elements 
 */
export function reconcileChildren(fiber: Fiber, elements?: any[]) {
  if (!elements) {
    return
  }
  let index = 0
  let oldFiber = fiber.alternate && fiber.alternate.child
  let prevSibling: Fiber | undefined = undefined
  while (
    index < elements.length ||
    oldFiber
  ) {
    const element = elements[index]
    let newFiber: Fiber | undefined = undefined
    if (Array.isArray(element)) {
      if (oldFiber) {
        if (oldFiber.array) {
          //diff更新
          newFiber = {
            parent: fiber,
            alternate: oldFiber,
            effectTag: "UPDATE"
          }
          addUpdate(newFiber)
        } else {
          oldFiber.effectTag = "DELETION"
          addDelect(oldFiber)
        }
      } else {
        //新增一条列表
        newFiber = {
          array: element,
          parent: fiber,
          effectTag: "PLACEMENT"
        }
        addAdd(newFiber)
      }
    } else {
      if (oldFiber && element && element.type == oldFiber.type) {
        //不变
        newFiber = {
          type: oldFiber.type,
          props: element.props,
          dom: oldFiber.dom,
          parent: fiber,
          alternate: oldFiber,
          effectTag: "UPDATE"
        }
        addUpdate(newFiber)
      } else {
        if (element) {
          //新增
          newFiber = {
            type: element.type,
            props: element.props,
            parent: fiber,
            effectTag: "PLACEMENT"
          }
          addAdd(newFiber)
        }
        if (oldFiber) {
          //将要删除的
          oldFiber.effectTag = "DELETION"
          addDelect(oldFiber)
        }
      }
    }
    if (oldFiber) {
      oldFiber = oldFiber.sibling
    }
    if (index == 0) {
      fiber.child = newFiber
    } else {
      prevSibling!.sibling = newFiber
    }
    prevSibling = newFiber
    index++
  }
}
