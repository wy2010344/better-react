import { addAdd, addDelect, addUpdate } from "./commitWork";
import { Fiber } from "./Fiber";

export function reconcileRepeat(fiber: Fiber) {
  const array = fiber.array
  if (array) {
    if (fiber.effectTag == "PLACEMENT") {
      let prevSibling: Fiber | undefined
      console.log(array, "array")
      array.elements.forEach((element, i) => {
        const key = element.props.key
        if (array.pool.has(key)) {
          throw `重复的key值${key}`
        } else {
          const childFiber: Fiber = {
            type: element.type,
            props: element.props,
            parent: fiber,
            effectTag: "PLACEMENT"
          }
          addAdd(childFiber)
          array.pool.set(key, childFiber)
          if (i == 0) {
            fiber.child = childFiber
          } else {
            prevSibling!.sibling = childFiber
          }
          prevSibling = childFiber
        }
      })
    } else if (fiber.effectTag == "UPDATE") {
      let prevSibling: Fiber | undefined
      const oldPool = fiber.alternate?.array?.pool!
      array.elements.forEach((element, i) => {
        const key = element.props.key
        if (array.pool.has(key)) {
          throw `重复的key值${key}`
        } else {
          const oldFiber = oldPool.get(key) //目前只使用了key
          let newFiber: Fiber | undefined = undefined
          if (oldFiber && oldFiber.type == element.type) {
            //修改,不变.key一定不能重复，但type可能不同，不同仍然要重新生成
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
            //新增
            newFiber = {
              type: element.type,
              props: element.props,
              parent: fiber,
              effectTag: "PLACEMENT"
            }
            addAdd(newFiber)
            if (oldFiber) {
              addDelect(oldFiber)
            }
          }
          array.pool.set(key, newFiber)
          if (i == 0) {
            fiber.child = newFiber
          } else {
            prevSibling!.sibling = newFiber
          }
          prevSibling = newFiber
        }
      })

      let oldChild = fiber.alternate?.child
      while (oldChild) {
        const key = oldChild.props!.key
        if (!array.pool.has(key)) {
          addDelect(oldChild)
        }
        oldChild = oldChild.sibling
      }
    } else {
      console.log("unsupport effect tag", fiber.effectTag, fiber)
    }
  }
}