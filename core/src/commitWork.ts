import { Fiber } from "./Fiber"
import { EmptyFun, ManageValue, StoreRef, emptyFun, iterableToList, numberSortAsc, quote, removeEqual, run, storeRef } from "wy-helper"
import { hookAddEffect, hookStateHoder } from "./cache"
import { StateHolder } from "./stateHolder"


export type CreateChangeAtom<T> = (v: T, didCommit?: (v: T) => T) => StoreRef<T>
export type Reconcile = (work?: EmptyFun) => void
export class EnvModel {
  realTime = storeRef(false)

  setRealTime() {
    if (this.onWork != 'commit') {
      throw new Error('只能在commit work中提交')
    }
    this.realTime.set(true)
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
  reconcile: Reconcile = null as any
  /**本次等待删除的fiber*/
  private readonly deletions: StateHolder[] = []
  addDelect(fiber: StateHolder) {
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
    this.out = {
      updateEffect: this.updateEffect,
      createChangeAtom: this.createChangeAtom
    } as any
  }
  shouldRender() {
    return this.changeAtoms.length > 0 || this.deletions.length > 0 || this.updateEffects.size
  }

  rollback() {
    this.changeAtoms.forEach(atom => atom.rollback())
    this.changeAtoms.length = 0
    this.deletions.length = 0
    this.updateEffects.clear()
  }

  layoutWork: EmptyFun = emptyFun

  layoutEffect: EmptyFun = emptyFun
  commit() {
    this.realTime.set(false)

    this.changeAtoms.forEach(atom => atom.commit())
    this.changeAtoms.length = 0

    this.deletions.forEach(notifyDel)
    this.deletions.length = 0

    const updateEffects = this.updateEffects
    const keys = iterableToList(updateEffects.keys()).sort(numberSortAsc)
    for (const key of keys) {
      updateEffects.get(key)?.forEach(run)
    }
    updateEffects.clear()
    this.layoutWork()
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
  ): ChangeStoreRef<T> {
    return new ChangeAtom(this.changeAtomsManage, value, didCommit || quote)
  }

  out!: {
    updateEffect(level: number, set: EmptyFun): void
    commitAll(): void
    createChangeAtom<T>(v: T, didCommit?: (v: T) => T): ChangeStoreRef<T>
  }
}
//优先级,1是及时,2是Layout,3是普通,4是延迟
export type LoopWorkLevel = 1 | 2 | 3 | 4
export type LoopWork = {
  type: "loop"
  level: LoopWorkLevel
  work?: EmptyFun
}
export type ChangeStoreRef<T> = StoreRef<T> & {
  getCommitValue(): T
}
/**
 * 需要区分create和update阶段
 */
class ChangeAtom<T> implements ChangeStoreRef<T> {
  private firstTime = true
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
    if (this.firstTime) {
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
    if (this.firstTime) {
      return this.value
    } else {
      if (this.dirty) {
        return this.draftValue
      }
      return this.value
    }
  }

  getCommitValue() {
    if (this.firstTime) {
      throw '刚创建,未生效'
    }
    return this.value
  }
  commit() {
    if (this.firstTime) {
      this.firstTime = false
      this.value = this.whenCommit(this.value)
    } else {
      this.dirty = false
      this.value = this.whenCommit(this.draftValue)
    }
  }
  rollback() {
    if (this.firstTime) {
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

function notifyDel(fiber: StateHolder) {
  destroyFiber(fiber)
  fiber.children?.forEach(child => {
    notifyDel(child)
  })
}
function destroyFiber(fiber: StateHolder) {
  fiber.destroyed = true
  const effects = fiber.effects
  if (effects) {
    const envModel = fiber.envModel
    effects.forEach(effect => {
      const state = effect.get()
      envModel.updateEffect(state.level, function () {
        const destroy = state.destroy
        if (destroy) {
          hookAddEffect(envModel.layoutEffect)
          destroy({
            isDestroy: true,
            value: state.value,
            beforeIsInit: state.isInit,
            beforeTrigger: state.deps,
            setRealTime: fiber.envModel.setRealTime
          })
          hookAddEffect(undefined)
        }
      })
    })
  }
}



export function deepTravelFiber<T extends any[]>(call: (Fiber: Fiber, ...vs: T) => void) {
  return function (fiber: Fiber, ...vs: T) {
    call(fiber, ...vs)
    const child = fiber.firstChild.get()
    if (child) {
      return child
    }
    /**寻找叔叔节点 */
    let nextFiber: Fiber | undefined = fiber
    while (nextFiber) {
      const next = nextFiber.next.get()
      if (next) {
        return next
      }
      nextFiber = nextFiber.parent
    }
    return undefined
  }
}


export function hookEnvModel() {
  return hookStateHoder().envModel.out
}