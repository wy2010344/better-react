import { Fiber, HookContextCosumer, VirtaulDomNode } from "./Fiber"
import { deepTravelFiber, findParentAndBefore } from "./findParentAndBefore"
import { AskNextTimeWork, WorkUnit } from "./reconcile"
import { quote, removeEqual } from "./util"


export type CreateChangeAtom<T> = (v: T, didCommit?: (v: T) => T) => StoreRef<T>
export class EnvModel {
  constructor(
    public rootFiber: Fiber | undefined,
    private readonly layout: () => void,
    /**异步地请求下一步*/
    getAskNextTimeWork: (env: EnvModel) => AskNextTimeWork<EnvModel>
  ) {
    this.askNextTimeWork = getAskNextTimeWork(this)
  }
  askNextTimeWork: AskNextTimeWork<EnvModel>
  /**请求下一步*/
  //任务列表
  readonly workList: WorkUnit[] = []
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
  private updateEffects: [UpdateEffect[], UpdateEffect[], UpdateEffect[]] = [[], [], []]
  updateEffect(set: UpdateEffect, level: UpdateEffectLevel) {
    this.updateEffects[level].push(set)
  }
  /**批量提交需要最终确认的atoms */
  readonly changeAtoms: ChangeAtom<any>[] = []
  hasChangeAtoms() {
    return this.changeAtoms.length > 0
  }

  rollback() {
    this.changeAtoms.forEach(atom => atom.rollback())
    this.changeAtoms.length = 0
    this.draftConsumers.forEach(draft => draft.destroy())
    this.draftConsumers.length = 0
    this.deletions.length = 0
    for (const updateEffect of this.updateEffects) {
      updateEffect.length = 0
    }
    // appends.length = 0
    // appendAsPortals.length = 0
  }
  commit() {
    /**最新更新所有注册的*/
    this.changeAtoms.forEach(atom => atom.commit())
    this.changeAtoms.length = 0
    /******清理所有的draft********************************************************/
    this.draftConsumers.length = 0
    /******清理删除********************************************************/
    // checkRepeat(deletions)
    this.deletions.forEach(function (fiber) {
      //清理effect
      notifyDel(fiber)
      //删除
      commitDeletion(fiber)
    })
    this.deletions.length = 0
    this.runUpdateEffect(0)
    /******更新属性********************************************************/
    this.runUpdateEffect(1)
    /******遍历修补********************************************************/
    // appendAsPortals.forEach(v => v.appendAsPortal())
    // appendAsPortals.length = 0
    // appends.forEach(v => v[0].appendAfter(v[1]))
    // appends.length = 0
    updateFixDom(this.rootFiber)
    this.layout()
    /******执行所有的effect********************************************************/
    this.runUpdateEffect(2)
  }
  private runUpdateEffect(level: UpdateEffectLevel) {
    const updateEffect = this.updateEffects[level]
    updateEffect.forEach(effect => effect())
    updateEffect.length = 0
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
    return new ChangeAtom(this, value, didCommit || quote)
  }

  batchUpdate = {
    on: false,
    works: [] as LoopWork[]
  }

  //当前任务
  currentTick = {
    on: false as boolean,
    //当前执行的render任务是否是低优先级的
    isLow: false as boolean,
    //提交的任务
    lowRollback: [] as LoopWork[]
  }

  renderWorks: EMPTY_FUN[] = []
}
export type EMPTY_FUN = () => void
export type LoopWork = {
  type: "loop"
  //是否是低优先级
  isLow?: boolean
  beforeWork?: EMPTY_FUN
  afterWork?: EMPTY_FUN
}
export type UpdateEffect = () => void
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
    private envModel: EnvModel,
    private value: T,
    private whenCommit: (v: T) => T
  ) {
    envModel.changeAtoms.push(this)
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
          this.envModel.changeAtoms.push(this)
        }
        this.draftValue = v
      } else {
        if (this.dirty) {
          this.dirty = false
          removeEqual(this.envModel.changeAtoms, this)
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
  if (fiber.dom) {
    // if (fiber.dom?.isPortal()) {
    //   return
    // }
    fiber.dom.removeFromParent()
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
      next = fiber.next.get()
    }
  }
}
function destroyFiber(fiber: Fiber) {
  fiber.destroyed = true
  const effects = fiber.hookEffects
  if (effects) {
    for (const effect of effects) {
      for (const ef of effect) {
        const state = ef.get()
        const destroy = state.destroy
        if (destroy) {
          destroy(state.deps)
        }
      }
    }
  }
  const listeners = fiber.hookContextCosumer
  listeners?.forEach(listener => {
    listener.destroy()
  })
  // if (fiber.dom.isPortal()) {
  //   fiber.dom.removeFromParent()
  // }
  fiber.dom?.destroy()
}