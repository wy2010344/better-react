import { Fiber, FiberData, HookContextCosumer, VirtaulDomNode, ChangeBodyFiber } from "./Fiber"

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
const changes: Fiber[] = []
export function addChange(fiber: Fiber) {
  changes.push(fiber)
}
export type UpdateEffect = () => void
/**本次所有需要执行的effects 
 * 分为3个等级,更新属性前,更新属性中,更新属性后
*/
export type UpdateEffectLevel = 0 | 1 | 2
const updateEffects: [UpdateEffect[], UpdateEffect[], UpdateEffect[]] = [[], [], []]
export function updateEffect(set: UpdateEffect, level: UpdateEffectLevel) {
  updateEffects[level].push(set)
}
/**计算出需要appends的节点 */
const appends: [VirtaulDomNode, FindParentAndBefore][] = []
export function addAppends(dom: VirtaulDomNode, pb: FindParentAndBefore) {
  appends.push([dom, pb])
}
/**计算出需要appends的Portal节点*/
const appendAsPortals: VirtaulDomNode[] = []
export function addAppendAsPortal(dom: VirtaulDomNode) {
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
  changes.forEach(rollbackTag)
  deletions.forEach(rollbackTag)

  draftConsumer.forEach(draft => draft.destroy())
  draftConsumer.length = 0
  changes.length = 0
  deletions.length = 0
  for (const updateEffect of updateEffects) {
    updateEffect.length = 0
  }
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
function commitEffectTag(v: Fiber) {
  const mv = v as any
  if (mv.draft) {
    mv.effectTag = undefined
    mv.current = mv.draft
    mv.draft = undefined
  } else {
    //console.log("已经被处理过了")
  }
}

function getEditData(v: Fiber): FiberData {
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
  changes.forEach(commitEffectTag)
  changes.length = 0

  deletions.forEach(commitEffectTag)
  /******清理删除********************************************************/
  deletions.forEach(function (fiber) {
    //清理effect
    notifyDel(fiber)
    //删除
    commitDeletion(fiber)
  })
  deletions.length = 0
  runUpdateEffect(0)
  /******更新属性********************************************************/
  runUpdateEffect(1)
  /******遍历修补********************************************************/
  appendAsPortals.forEach(v => v.appendAsPortal())
  appendAsPortals.length = 0
  appends.forEach(v => v[0].appendAfter(v[1]))
  appends.length = 0
  /******执行所有的effect********************************************************/
  runUpdateEffect(2)
  /******清理所有的draft********************************************************/
  draftConsumer.length = 0
}

function runUpdateEffect(level: UpdateEffectLevel) {
  const updateEffect = updateEffects[level]
  updateEffect.forEach(effect => effect())
  updateEffect.length = 0
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
  const effects = fiber.hookEffects
  if (effects) {
    for (const effect of effects) {
      for (const ef of effect) {
        const destroy = ef.get().destroy
        if (destroy) {
          destroy()
        }
      }
    }
  }
  const listeners = fiber.hookContextCosumer
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