import { addAdd, addDelect, addSort, addUpdate } from "./commitWork"
import { Fiber } from "./Fiber"

/**
 * 更新子节点为新的计算后的fiber
 * @param fiber 
 * @param elements 
 */
export function reconcileChildren(fiber: Fiber, elements?: any[]) {
  if (!Array.isArray(elements)) {
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
            array: {
              elements: element,
              pool: new Map()
            },
            parent: fiber,
            alternate: oldFiber,
            effectTag: "UPDATE"
          }
          addUpdate(newFiber)
          console.log("fi", newFiber)
          addSort(newFiber)
        } else {
          oldFiber.effectTag = "DELETION"
          addDelect(oldFiber)
        }
      } else {
        //新增一条列表。这里就要整理好。。。。
        newFiber = {
          array: {
            elements: element,
            pool: new Map()
          },
          parent: fiber,
          effectTag: "PLACEMENT"
        }
        addAdd(newFiber)
        addSort(newFiber)
      }
    } else {
      if (oldFiber && element && element.type == oldFiber.type && Object.is(element.props.key, element.props.key)) {
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