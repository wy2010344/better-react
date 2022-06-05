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
const addes: Fiber[] = []
export function addAdd(fiber: Fiber) {
  addes.push(fiber)
}
export type UpdateEffect = () => void
const updateEffects: UpdateEffect[] = []
export function updateEffect(set: UpdateEffect) {
  updateEffects.push(set)
}

const appends: [VirtaulDomNode, FindParentAndBefore][] = []
export function addAppends(dom: VirtaulDomNode, pb: FindParentAndBefore) {
  appends.push([dom, pb])
}
const appendAsPortals: VirtaulDomNode[] = []
export function addAppendAsPortal(dom: VirtaulDomNode) {
  appendAsPortals.push(dom)
}

export function rollback() {
  addes.forEach(rollbackTag)
  updates.forEach(rollbackTag)
  deletions.forEach(rollbackTag)

  draftConsumer.forEach(draft => draft.destroy())
  addes.length = 0
  updates.length = 0
  deletions.length = 0
  updateEffects.length = 0
  draftConsumer.length = 0
  appends.length = 0
  appendAsPortals.length = 0
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
  appendAsPortals.forEach(v => v.appendAsPortal())
  appendAsPortals.length = 0
  appends.forEach(v => v[0].appendAfter(v[1]))
  appends.length = 0
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

export type FindParentAndBefore = [VirtaulDomNode, VirtaulDomNode | null] | [VirtaulDomNode | null, VirtaulDomNode] | null
/**
 * portal内的节点不会找到portal外，portal外的节点不会找到portal内。
 * 即向前遍历，如果该节点是portal，跳过再向前
 * 向上遍历，如果该节点是portal，不再向上---本来不会再向上。
 * @param fiber 
 * @returns 
 */


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