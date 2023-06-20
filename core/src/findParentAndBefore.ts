import { Fiber, VirtaulDomNode } from "./Fiber";
export type FindParentAndBefore = [VirtaulDomNode, VirtaulDomNode | null] | [VirtaulDomNode | null, VirtaulDomNode] | null


/**
 * 如果在render阶段确定,当然比较符号imgUI.
 * 如果在最后定义,在当前,比较节省性能
 * ——这是仅属于dom的fiber
 * @param fiber 
 */


export function findParentAndBefore(fiber: Fiber) {
  const dom = fiber.dom
  if (dom) {
    // if (dom.isPortal()) {
    //   addAppendAsPortal(dom)
    // } else {
    //   const prevData = fiber.before.get()
    //   const parentBefore = prevData
    //     ? getCurrentBefore(prevData)
    //     : findParentBefore(fiber)
    //   if (parentBefore) {
    //     addAppends(dom, parentBefore)
    //   } else {
    //     console.error("未找到", fiber.dom)
    //   }
    // }
    const prevData = fiber.before.get()
    const parentBefore = prevData
      ? getCurrentBefore(prevData)
      : findParentBefore(fiber)
    if (parentBefore) {
      dom.appendAfter(parentBefore)
      // addAppends(dom, parentBefore)
    } else {
      //console.error("未找到", fiber.dom)
    }
  }
}


function getCurrentBefore(fiber: Fiber): FindParentAndBefore {
  // if (fiber.dom?.isPortal()) {
  //   const prev = fiber.before.get()
  //   if (prev) {
  //     return getCurrentBefore(prev)
  //   } else {
  //     return findParentBefore(fiber)
  //   }
  // }
  if (fiber.dom) {
    //portal节点不能作为邻节点
    return [getParentDomFilber(fiber).dom!, fiber.dom]
  }
  const lastChild = fiber.lastChild.get()
  if (lastChild) {
    //在子节点中寻找
    const dom = getCurrentBefore(lastChild)
    if (dom) {
      return dom
    }
  }
  const prev = fiber.before.get()
  if (prev) {
    //在兄节点中找
    const dom = getCurrentBefore(prev)
    if (dom) {
      return dom
    }
  }
  return findParentBefore(fiber)
}


function findParentBefore(fiber: Fiber): FindParentAndBefore {
  const parent = fiber.parent
  if (parent) {
    if (parent.dom) {
      //找到父节点，且父节点是有dom的
      return [parent.dom, null]
    }
    const prev = parent.before.get()
    if (prev) {
      //在父的兄节点中寻找
      const dom = getCurrentBefore(prev)
      if (dom) {
        return dom
      }
    }
    return findParentBefore(parent)
  }
  return null
}

function getParentDomFilber(fiber: Fiber) {
  let domParentFiber = fiber.parent
  while (!domParentFiber?.dom) {
    domParentFiber = domParentFiber?.parent
  }
  return domParentFiber
}


export function deepTravelFiber<T extends any[]>(call: (Fiber: Fiber, ...vs: T) => void) {
  return function (fiber: Fiber, ...vs: T) {
    call(fiber, ...vs)
    //findParentAndBefore(fiber)
    const child = fiber.firstChild.get()
    if (child) {
      // if (child.parent != fiber) {
      //   console.log("错误,子节点与父节点不对应", child)
      // }
      return child
    }
    /**寻找叔叔节点 */
    let nextFiber: Fiber | undefined = fiber
    while (nextFiber) {
      const next = nextFiber.next.get()
      if (next) {
        // if (next.parent != nextFiber.parent) {
        //   console.log("错误,子节点与父节点不对应11", child)
        // }
        // if (next.before.get() != nextFiber) {
        //   console.log("错误,弟节点与兄不对应", next)
        // }
        return next
      }
      // if (nextFiber.parent) {
      //   if (nextFiber.parent.lastChild.get() != nextFiber) {
      //     console.log("错误!最后一个节点不与自己对应", nextFiber)
      //   }
      // }
      nextFiber = nextFiber.parent
    }
    return undefined
  }
}