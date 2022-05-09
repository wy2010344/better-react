import { Fiber, VirtaulDomNode } from "./Fiber"

//等待删除的fiber
const deletions: Fiber[] = []
export function addDelect(fiber: Fiber) {
  deletions.push(fiber)
}
const updates: Fiber[] = []
export function addUpdate(fiber: Fiber) {
  updates.push(fiber)
}
const dirtys: Fiber[] = []
export function addDirty(fiber: Fiber) {
  dirtys.push(fiber)
}
const addes: Fiber[] = []
export function addAdd(fiber: Fiber) {
  addes.push(fiber)
}
export type UpdateEffect = () => void
const updateEffects: UpdateEffect[] = []
export function updateEffect(set: UpdateEffect) {
  updateEffects.push(set)
}
/**
 * 提交变更应该从根dirty节点开始。
 * 找到最顶层dirty节点->计算出新的节点替换当前->对比标记新节点->更新
 */
export function commitRoot() {
  /******清理删除********************************************************/
  deletions.forEach(function (fiber) {
    //清理effect
    notifyDel(fiber)
    //删除
    commitDeletion(fiber)
    fiber.effectTag = undefined
  })
  deletions.length = 0
  /******更新属性********************************************************/
  //新加的初始化属性
  addes.forEach(function (fiber) {
    if (fiber.dom) {
      fiber.dom.update(fiber.props)
    }
  })
  //旧的更新属性
  updates.forEach(function (fiber) {
    if (fiber.dom) {
      fiber.dom.update(fiber.props)
    }
    fiber.alternate = undefined
    fiber.effectTag = undefined
  })
  updates.length = 0
  /******遍历修补********************************************************/
  dirtys.forEach(function (fiber) {
    fiber.effectTag = undefined
    deepUpdateDirty(fiber)
  })
  dirtys.length = 0
  /******初始化ref********************************************************/
  addes.forEach(function (fiber) {
    fiber.effectTag = undefined
    if (fiber.dom) {
      fiber.dom.init()
    }
  })
  addes.length = 0
  /******执行所有的effect********************************************************/
  updateEffects.forEach(update => {
    update()
  })
  updateEffects.length = 0
}

function deepUpdateDirty(fiber: Fiber) {
  let child = fiber.child
  let prevChild: Fiber | undefined
  while (child) {
    child.prev = prevChild
    if (child.dom) {
      if (child.dom.isPortal()) {
        child.dom.appendAsPortal()
      } else {
        //portal不能作为子节点
        const parentBefore = child.prev
          ? getCurrentBefore(child.prev)
          : findParentBefore(child)
        if (parentBefore) {
          child.dom.appendAfter(parentBefore)
        } else {
          console.error("未找到", child.dom)
        }
      }
    }
    deepUpdateDirty(child)
    const nextChild = child.sibling
    if (!nextChild) {
      fiber.lastChild = child
    }
    prevChild = child
    child = nextChild
  }
}

export type FindParentAndBefore = [VirtaulDomNode, VirtaulDomNode | null] | [VirtaulDomNode | null, VirtaulDomNode] | null
/**
 * portal内的节点不会找到portal外，portal外的节点不会找到portal内。
 * 即向前遍历，如果该节点是portal，跳过再向前
 * 向上遍历，如果该节点是portal，不再向上---本来不会再向上。
 * @param fiber 
 * @returns 
 */
function getCurrentBefore(fiber: Fiber): FindParentAndBefore {
  if (fiber.dom?.isPortal()) {
    if (fiber.prev) {
      return getCurrentBefore(fiber.prev)
    } else {
      return findParentBefore(fiber)
    }
  }
  if (fiber.dom) {
    //portal节点不能作为邻节点
    return [getParentDomFilber(fiber).dom!, fiber.dom]
  }
  if (fiber.lastChild) {
    //在子节点中寻找
    const dom = getCurrentBefore(fiber.lastChild)
    if (dom) {
      return dom
    }
  }
  if (fiber.prev) {
    //在兄节点中找
    const dom = getCurrentBefore(fiber.prev)
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
    if (parent.prev) {
      //在父的兄节点中寻找
      const dom = getCurrentBefore(parent.prev)
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
/**
 * 需要一直找到具有dom节点的子项
 * @param fiber 
 * @param domParent 
 */
function commitDeletion(fiber: Fiber) {
  if (fiber.dom) {
    removeFromDom(fiber)
  } else {
    circleCommitDelection(fiber.child)
  }
}
function circleCommitDelection(fiber: Fiber | undefined) {
  if (fiber) {
    if (fiber.dom) {
      removeFromDom(fiber)
    } else {
      circleCommitDelection(fiber.child)
    }
    circleCommitDelection(fiber.sibling)
  }
}

function removeFromDom(fiber: Fiber) {
  if (fiber.dom?.isPortal()) {
    return
  }
  fiber.dom?.removeFromParent()
}
function notifyDel(fiber: Fiber) {
  destroyFiber(fiber)
  if (fiber.child) {
    let next: Fiber | undefined = fiber.child
    while (next) {
      notifyDel(next)
      next = next.sibling
    }
  }
}
function destroyFiber(fiber: Fiber) {
  const effect = fiber.hooks?.effect
  if (effect) {
    effect.forEach(ef => ef().destroy?.())
  }
  const listeners = fiber.hooks?.contextCosumer
  if (listeners) {
    listeners.forEach(listener => listener().destroy())
  }
  if (fiber.dom) {
    if (fiber.dom.isPortal()) {
      fiber.dom.removeFromParent()
    }
    fiber.dom.destroy()
  }
}