import { FiberImpl } from "./Fiber"
import { EmptyFun, ManageValue, StoreRef, emptyFun, iterableToList, quote, removeEqual, run, storeRef } from "wy-helper"


export type CreateChangeAtom<T> = (v: T, didCommit?: (v: T) => T) => StoreRef<T>
export type Reconcile = (work?: EmptyFun) => void

/**
 * 涉及修改ref
 * useEffect里面可以直接执行
 * 主要是promise等外部事件,恰好在render中
 *   非render时可以立即执行.
 *   否则得在render完成后执行.
 */
export class EnvModel {
  realTime = storeRef(false)

  setRealTime() {
    if (this.onWork != 'commit') {
      throw new Error('只能在commit work中提交')
    }
    //对应useLayoutEffect
    const that = this
    that.realTime.set(true)
    that.reconcile(function () {
      that.updateEffect(0, function () {
        that.realTime.set(false)
      })
    })
  }


  private onWork: boolean | 'commit' = false
  setOnWork(isCommit?: boolean) {
    this.onWork = isCommit ? 'commit' : true
  }
  isOnWork() {
    return this.onWork
  }
  finishWork() {
    this.onWork = false
  }
  commitAll: () => void = emptyFun
  reconcile: Reconcile = null as any
  /**本次等待删除的fiber*/
  private readonly deletions: FiberImpl[] = []
  addDelect(fiber: FiberImpl) {
    this.deletions.push(fiber)
  }
  private updateEffects = new Map<number, EmptyFun[]>()
  updateEffect(level: number, set: EmptyFun) {
    const old = this.updateEffects.get(level)
    const array = old || []
    if (!old) {
      this.updateEffects.set(level, array)
    }
    array.push(set)
  }
  /**批量提交需要最终确认的atoms */
  private readonly changeAtoms: ChangeAtom<any>[]
  private changeAtomsManage: ManageValue<ChangeAtom<any>>
  constructor() {
    this.setRealTime = this.setRealTime.bind(this)
    this.createChangeAtom = this.createChangeAtom.bind(this)
    this.updateEffect = this.updateEffect.bind(this)
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
  }
  shouldRender() {
    //changeAtoms说明有状态变化,deletions表示,比如销毁
    return this.changeAtoms.length > 0 || this.deletions.length > 0 || this.updateEffects.size
  }

  rollback() {
    this.changeAtoms.forEach(atom => atom.rollback())
    this.changeAtoms.length = 0
    this.deletions.length = 0
    this.updateEffects.clear()
  }
  commit() {
    /**最新更新所有注册的*/
    this.changeAtoms.forEach(atom => atom.commit())
    this.changeAtoms.length = 0
    /******清理删除********************************************************/
    /******清理所有的draft********************************************************/
    this.deletions.forEach(notifyDel)
    this.deletions.length = 0
    // /******更新属性********************************************************/
    //执行所有effect
    const updateEffects = this.updateEffects
    const keys = iterableToList(updateEffects.keys()).sort()
    for (const key of keys) {
      updateEffects.get(key)?.forEach(run)
    }
    updateEffects.clear()
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

//优先级,1是及时,2是普通,3是延迟
export type LoopWorkLevel = 1 | 2 | 3
export type LoopWork = {
  type: "loop"
  level: LoopWorkLevel
  work?: EmptyFun
}
/**
 * 需要区分create和update阶段
 */
class ChangeAtom<T> implements StoreRef<T> {
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
      /**
       * 主要是构造阶段设定的就是正式值,要么本次构造一起回滚
       */
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
/**
 * portal内的节点不会找到portal外，portal外的节点不会找到portal内。
 * 即向前遍历，如果该节点是portal，跳过再向前
 * 向上遍历，如果该节点是portal，不再向上---本来不会再向上。
 * @param fiber 
 * @returns 
 */

function notifyDel(fiber: FiberImpl) {
  destroyFiber(fiber)
  const child = fiber.firstChild.get()
  if (child) {
    let next: FiberImpl | void = child
    while (next) {
      notifyDel(next)
      next = next.next.get()
    }
  }
}
function destroyFiber(fiber: FiberImpl) {
  fiber.destroyed = true
  const effects = fiber.hookEffects
  if (effects) {
    const keys = iterableToList(effects.keys()).sort()
    for (const key of keys) {
      effects.get(key)?.forEach(effect => {
        const state = effect.get()
        const destroy = state.destroy
        if (destroy) {
          destroy({
            isDestroy: true,
            beforeIsInit: state.isInit,
            beforeTrigger: state.deps,
            setRealTime: fiber.envModel.setRealTime
          })
        }
      })
    }
  }
  // fiber.dom?.destroy()
}



export function deepTravelFiber<T extends any[]>(call: (Fiber: FiberImpl, ...vs: T) => void) {
  return function (fiber: FiberImpl, ...vs: T) {
    call(fiber, ...vs)
    const child = fiber.firstChild.get()
    if (child) {
      return child
    }
    /**寻找叔叔节点 */
    let nextFiber: FiberImpl | undefined = fiber
    while (nextFiber) {
      const next = nextFiber.next.get()
      nextFiber.onRenderLeave()
      if (next) {
        return next
      }
      nextFiber = nextFiber.parent
    }
    return undefined
  }
}