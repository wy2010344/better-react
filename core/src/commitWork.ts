import { Fiber, FiberData, HookContextCosumer, VirtaulDomNode, WithDraftFiber } from "./Fiber"

const draftConsumer: HookContextCosumer[] = []
export function addDraftConsumer(v: HookContextCosumer) {
  draftConsumer.push(v)
}
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

export function rollback() {
  addes.forEach(rollbackTag)
  updates.forEach(rollbackTag)
  deletions.forEach(rollbackTag)
  dirtys.forEach(rollbackTag)

  draftConsumer.forEach(draft => draft.destroy())
  addes.length = 0
  updates.length = 0
  deletions.length = 0
  dirtys.length = 0
  updateEffects.length = 0
  draftConsumer.length = 0
}
function rollbackTag(v: Fiber<any>) {
  const mv = v as any
  if (mv.draft) {
    mv.draft = undefined
    mv.effectTag = undefined
  }
}
function clearEffectTag(v: Fiber<any>) {
  const mv = v as any
  if (mv.draft) {
    mv.effectTag = undefined
    mv.current = mv.draft
    mv.draft = undefined
  } else {
    //console.log("已经被处理过了")
  }
}

function getEditData(v: Fiber): FiberData<any> {
  return (v as any).current
}
/**
 * 提交变更应该从根dirty节点开始。
 * 找到最顶层dirty节点->计算出新的节点替换当前->对比标记新节点->更新
 */
export function commitRoot() {
  //将所有缓存提交
  addes.forEach(clearEffectTag)
  updates.forEach(clearEffectTag)
  deletions.forEach(clearEffectTag)
  dirtys.forEach(clearEffectTag)
  /******清理删除********************************************************/
  deletions.forEach(function (fiber) {
    //清理effect
    notifyDel(fiber)
    //删除
    commitDeletion(fiber)
  })
  deletions.length = 0
  /******更新属性********************************************************/
  //新加的初始化属性
  addes.forEach(function (fiber) {
    if (fiber.dom) {
      fiber.dom.create(getEditData(fiber).props)
    }
  })
  //旧的更新属性
  updates.forEach(function (fiber) {
    if (fiber.dom) {
      fiber.dom.update(getEditData(fiber).props)
    }
  })
  updates.length = 0
  /******遍历修补********************************************************/
  dirtys.forEach(function (fiber) {
    deepUpdateDirty(fiber)
  })
  dirtys.length = 0
  /******初始化ref********************************************************/
  addes.forEach(function (fiber) {
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
  /******清理所有的draft********************************************************/
  draftConsumer.length = 0
}

function deepUpdateDirty(fiber: Fiber) {
  let child = getEditData(fiber).child
  let prevChild: Fiber | undefined
  while (child) {
    getEditData(child).prev = prevChild
    if (child.dom) {
      if (child.dom.isPortal()) {
        child.dom.appendAsPortal()
      } else {
        //portal不能作为子节点
        const prevData = getEditData(child).prev
        const parentBefore = prevData
          ? getCurrentBefore(prevData)
          : findParentBefore(child)
        if (parentBefore) {
          child.dom.appendAfter(parentBefore)
        } else {
          console.error("未找到", child.dom)
        }
      }
    }
    deepUpdateDirty(child)
    const nextChild = getEditData(child).sibling
    if (!nextChild) {
      getEditData(fiber).lastChild = child
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
    const prev = getEditData(fiber).prev
    if (prev) {
      return getCurrentBefore(prev)
    } else {
      return findParentBefore(fiber)
    }
  }
  if (fiber.dom) {
    //portal节点不能作为邻节点
    return [getParentDomFilber(fiber).dom!, fiber.dom]
  }
  const lastChild = getEditData(fiber).lastChild
  if (lastChild) {
    //在子节点中寻找
    const dom = getCurrentBefore(lastChild)
    if (dom) {
      return dom
    }
  }
  const prev = getEditData(fiber).prev
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
    const prev = getEditData(parent).prev
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
/**
 * 需要一直找到具有dom节点的子项
 * @param fiber 
 * @param domParent 
 */
function commitDeletion(fiber: Fiber) {
  if (fiber.dom) {
    removeFromDom(fiber)
  } else {
    circleCommitDelection(getEditData(fiber).child)
  }
}
function circleCommitDelection(fiber: Fiber | undefined) {
  if (fiber) {
    if (fiber.dom) {
      removeFromDom(fiber)
    } else {
      circleCommitDelection(getEditData(fiber).child)
    }
    circleCommitDelection(getEditData(fiber).sibling)
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
  const child = getEditData(fiber).child
  if (child) {
    let next: Fiber | undefined = child
    while (next) {
      notifyDel(next)
      next = getEditData(next).sibling
    }
  }
}
function destroyFiber(fiber: Fiber) {
  const effects = getEditData(fiber).hookEffect
  effects?.forEach(effect => {
    const destroy = effect.destroy
    if (destroy) {
      destroy()
    }
  })
  const listeners = getEditData(fiber).hookContextCosumer
  listeners?.forEach(listener => {
    listener.destroy()
  })
  if (fiber.dom) {
    if (fiber.dom.isPortal()) {
      fiber.dom.removeFromParent()
    }
    fiber.dom.destroy()
  }
}