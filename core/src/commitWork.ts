import { Fiber, HookContextCosumer, VirtaulDomNode } from "./Fiber"
import { deepTravelFiber, findParentAndBefore } from "./findParentAndBefore"
import { EmptyFun, ManageValue, quote, removeEqual, storeRef } from "./util"


export type CreateChangeAtom<T> = (v: T, didCommit?: (v: T) => T) => StoreRef<T>
export type Reconcile = (work?: EmptyFun) => void
export class EnvModel {
  realTime = storeRef(false)
  flushSync(fun: EmptyFun) {
    const that = this
    that.realTime.set(true)
    fun()
    this.reconcile(function () {
      that.updateEffect(function () {
        that.realTime.set(false)
      })
    })
  }

  reconcile: Reconcile = null as any
  // readonly askNextTimeWork: () => void
  /**本次新注册的监听者*/
  private readonly draftConsumers: HookContextCosumer<any, any>[] = []
  addDraftConsumer(v: HookContextCosumer<any, any>) {
    this.draftConsumers.push(v)
  }
  /**本次等待删除的fiber*/
  private readonly deletions: Fiber[] = []
  addDelect(fiber: Fiber) {
    this.deletions.push(fiber)
  }
  private updateEffects: EmptyFun[] = []
  updateEffect(set: EmptyFun) {
    this.updateEffects.push(set)
  }
  /**批量提交需要最终确认的atoms */
  private readonly changeAtoms: ChangeAtom<any>[]
  private changeAtomsManage: ManageValue<ChangeAtom<any>>
  constructor() {
    const changeAtoms: ChangeAtom<any>[] = []
    this.changeAtoms = changeAtoms
    this.changeAtomsManage = {
      add(v) {
        changeAtoms.push(v)
      },
      remove(v) {
        removeEqual(changeAtoms, v)
      },
    }
    this.flushSync = this.flushSync.bind(this)
    this.createChangeAtom = this.createChangeAtom.bind(this)
  }
  shouldRender() {
    //changeAtoms说明有状态变化,deletions表示,比如销毁
    return this.changeAtoms.length > 0 || this.deletions.length > 0
  }

  rollback() {
    this.changeAtoms.forEach(atom => atom.rollback())
    this.changeAtoms.length = 0
    this.draftConsumers.forEach(draft => draft.destroy())
    this.draftConsumers.length = 0
    this.deletions.length = 0
    this.updateEffects.length = 0
    // appends.length = 0
    // appendAsPortals.length = 0
  }
  commit(rootFiber: Fiber, layout: () => void) {
    /**最新更新所有注册的*/
    this.changeAtoms.forEach(atom => atom.commit())
    this.changeAtoms.length = 0
    /******清理删除********************************************************/
    /******清理所有的draft********************************************************/
    this.draftConsumers.length = 0
    // checkRepeat(deletions)
    this.deletions.forEach(function (fiber) {
      //清理effect
      notifyDel(fiber)
      //删除
      commitDeletion(fiber)
    })
    this.deletions.length = 0
    /******更新属性********************************************************/
    updateFixDom(rootFiber)

    //执行所有effect
    const updateEffect = this.updateEffects
    updateEffect.forEach(effect => effect())
    updateEffect.length = 0

    layout()
  }
  /**
 * 在commit期间修改后,都是最新值,直到commit前,都可以回滚
 * @param value 
 * @param didCommit 
 * @returns 
 */
  createChangeAtom<T>(
    value: T,
    didCommit?: (v: T) => T
  ): StoreRef<T> {
    return new ChangeAtom(this.changeAtomsManage, value, didCommit || quote)
  }
}
export type LoopWork = {
  type: "loop"
  //是否是低优先级
  isLow?: boolean
  work?: EmptyFun
}
/**本次所有需要执行的effects 
 * 分为3个等级,更新属性前,更新属性中,更新属性后
*/
export type UpdateEffectLevel = 0 | 1 | 2

/**计算出需要appends的节点 */
// const appends: [VirtaulDomNode, FindParentAndBefore][] = []
// export function addAppends(dom: VirtaulDomNode, pb: FindParentAndBefore) {
//   appends.push([dom, pb])
// }
/**计算出需要appends的Portal节点*/
// const appendAsPortals: VirtaulDomNode[] = []
// export function addAppendAsPortal(dom: VirtaulDomNode) {
//   appendAsPortals.push(dom)
// }
export type StoreRef<T> = {
  set(v: T): void
  get(): T
}

/**
 * 需要区分create和update阶段
 */
class ChangeAtom<T> implements StoreRef<T>{
  private isCreate = true
  constructor(
    private manage: ManageValue<ChangeAtom<any>>,
    private value: T,
    private whenCommit: (v: T) => T
  ) {
    this.manage.add(this)
  }
  dirty = false
  draftValue!: T
  set(v: T) {
    if (this.isCreate) {
      this.value = v
    } else {
      if (v != this.value) {
        if (!this.dirty) {
          this.dirty = true
          this.manage.add(this)
        }
        this.draftValue = v
      } else {
        if (this.dirty) {
          this.dirty = false
          this.manage.remove(this)
        }
        this.draftValue = this.value
      }
    }
  }
  get() {
    if (this.isCreate) {
      return this.value
    } else {
      if (this.dirty) {
        return this.draftValue
      }
      return this.value
    }
  }
  commit() {
    if (this.isCreate) {
      this.isCreate = false
      this.value = this.whenCommit(this.value)
    } else {
      this.dirty = false
      this.value = this.whenCommit(this.draftValue)
    }
  }
  rollback() {
    if (this.isCreate) {
      //不处理?一般挂在hooks上会丢弃
    } else {
      this.dirty = false
    }
  }
}
// function checkRepeat<T>(vs: T[]) {
//   for (let i = 0; i < vs.length; i++) {
//     const v = vs[i]
//     for (let x = i + 1; x < vs.length; x++) {
//       const r = vs[x]
//       if (v == r) {
//         console.log("出错,出现重复的数组", v)
//       }
//     }
//   }
// }
/**
 * 提交变更应该从根dirty节点开始。
 * 找到最顶层dirty节点->计算出新的节点替换当前->对比标记新节点->更新
 */
function updateFixDom(fiber: Fiber | undefined) {
  while (fiber) {
    fiber = fixDomAppend(fiber)
  }
}
const fixDomAppend = deepTravelFiber(findParentAndBefore)



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
  const dom = fiber.dom
  if (dom) {
    if (!dom.isPortal) {
      //portal自己在destroy里移除
      dom.removeFromParent()
    }
  } else {
    circleCommitDelection(fiber.firstChild.get())
  }
}
function circleCommitDelection(fiber: Fiber | void) {
  if (fiber) {
    commitDeletion(fiber)
    circleCommitDelection(fiber.next.get())
  }
}

function notifyDel(fiber: Fiber) {
  destroyFiber(fiber)
  const child = fiber.firstChild.get()
  if (child) {
    let next: Fiber | void = child
    while (next) {
      notifyDel(next)
      next = next.next.get()
    }
  }
}
function destroyFiber(fiber: Fiber) {
  fiber.destroyed = true
  const effects = fiber.hookEffects
  if (effects) {
    for (const effect of effects) {
      const state = effect.get()
      const destroy = state.destroy
      if (destroy) {
        destroy(state.deps)
      }
    }
  }
  const listeners = fiber.hookContextCosumer
  listeners?.forEach(listener => {
    listener.destroy()
  })
  fiber.dom?.destroy()
}