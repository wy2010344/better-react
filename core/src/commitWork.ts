import { Fiber, FiberData, HookContextCosumer, VirtaulDomNode, WithDraftFiber } from "./Fiber"

/**本次新注册的监听者*/
const draftConsumer: HookContextCosumer<any, any>[] = []
export function addDraftConsumer(v: HookContextCosumer<any, any>) {
  draftConsumer.push(v)
}
/**本次等待删除的fiber*/
const deletions: Fiber[] = []
export function addDelect(fiber: Fiber) {
  deletions.push(fiber)
}
/**本次需要更新的fiber */
const updates: Fiber[] = []
export function addUpdate(fiber: Fiber) {
  updates.push(fiber)
}
/**本次新添加的fiber */
const addes: Fiber[] = []
export function addAdd<T>(fiber: Fiber<T>) {
  addes.push(fiber)
}
export type UpdateEffect = () => void
/**本次所有需要执行的effects */
const updateEffects: UpdateEffect[] = []
export function updateEffect(set: UpdateEffect) {
  updateEffects.push(set)
}
/**计算出需要appends的节点 */
const appends: [VirtaulDomNode, FindParentAndBefore][] = []
export function addAppends(dom: VirtaulDomNode<any>, pb: FindParentAndBefore) {
  appends.push([dom, pb])
}
/**计算出需要appends的Portal节点*/
const appendAsPortals: VirtaulDomNode<any>[] = []
export function addAppendAsPortal<T>(dom: VirtaulDomNode<T>) {
  appendAsPortals.push(dom)
}
/**批量提交需要最终确认的atoms */
const changeAtoms: ChangeAtom<any>[] = []
export type ChangeAtomValue<T> = {
  set(v: T): void
  get(): T
}
function defaultDidCommit<T>(v: T) { }
/**
 * 在commit期间修改后,都是最新值,直到commit前,都可以回滚
 * @param value 
 * @param didCommit 
 * @returns 
 */
export function createChangeAtom<T>(
  value: T,
  didCommit?: (v: T) => void
): ChangeAtomValue<T> {
  return new ChangeAtom(value, didCommit || defaultDidCommit)
}
class ChangeAtom<T> implements ChangeAtomValue<T>{
  constructor(
    private value: T,
    private didCommit: (v: T) => void
  ) { }
  dirty = false
  draftValue!: T
  set(v: T) {
    if (!this.dirty) {
      this.dirty = true
      changeAtoms.push(this)
    }
    this.draftValue = v
  }
  get() {
    if (this.dirty) {
      return this.draftValue
    }
    return this.value
  }
  commit() {
    this.dirty = false
    this.value = this.draftValue
    this.didCommit(this.draftValue)
  }
  rollback() {
    this.dirty = false
  }
}

export function rollback() {
  changeAtoms.forEach(atom => atom.rollback())
  changeAtoms.length = 0
  addes.forEach(rollbackTag)
  updates.forEach(rollbackTag)
  deletions.forEach(rollbackTag)

  draftConsumer.forEach(draft => draft.destroy())
  draftConsumer.length = 0
  addes.length = 0
  updates.length = 0
  deletions.length = 0
  updateEffects.length = 0
  appends.length = 0
  appendAsPortals.length = 0
}
function rollbackTag(v: Fiber) {
  const mv = v as any
  if (mv.draft) {
    mv.draft = undefined
    mv.effectTag = undefined
  }
}
function clearEffectTag(v: Fiber) {
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
  /**最新更新所有注册的*/
  changeAtoms.forEach(atom => atom.commit())
  changeAtoms.length = 0
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
  if (fiber.dom?.isPortal(getEditData(fiber).props)) {
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
  const effects = fiber.hookEffect
  effects?.forEach(effect => {
    const destroy = effect.get().destroy
    if (destroy) {
      destroy()
    }
  })
  const listeners = fiber.hookContextCosumer
  listeners?.forEach(listener => {
    listener.destroy()
  })
  if (fiber.dom) {
    if (fiber.dom.isPortal(getEditData(fiber).props)) {
      fiber.dom.removeFromParent()
    }
    fiber.dom.destroy()
  }
}