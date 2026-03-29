import { Fiber } from './Fiber'
import {
  EmptyFun,
  NextTimeWork,
  SetValue,
  effectsAddLevel,
  effectsRunInOrder,
  emptyFun,
  storeRef,
} from 'wy-helper'
import { StateHolder } from './stateHolder'
import { IEnvModel as IEnvModelB } from 'wy-helper/state-function'
import { hookSetBeforeFiber } from './cache'
import { AppState, LoopWorkLevel } from './reconcile'

export type Reconcile = (work?: EmptyFun) => void

export interface IEnvModel extends IEnvModelB<StateHolder> {
  updateEffect(level: number, set: EmptyFun): void
}
/**
 * @todo 区分持有全局的状态，与每次render收集的变化。
 * 这样就不用回滚
 */
let uid = 0
export class EnvModel implements IEnvModel {
  readonly id = uid++
  private workList: NextTimeWork<IEnvModel>[] = []
  private workListIndex = 0
  private lastCommit: NextTimeWork<IEnvModel>
  private workLoop(unitOfWork: Fiber) {
    const nextUnitOfWork = performUnitOfWork(unitOfWork, this)
    if (nextUnitOfWork) {
      this.workList.push(() => {
        this.checkState()
        this.workListIndex++
        this.workLoop(nextUnitOfWork)
      })
    } else {
      this.workList.push(this.lastCommit)
    }
  }

  hasRender() {
    return this.beginRender
  }
  private beginRender = false
  render() {
    this.checkState()
    if (this.beginRender) {
      return this.workList[this.workListIndex]
    }
    return this.startRender
  }

  private startRender = () => {
    this.checkState()
    this.beginRender = true
    this.workLoop(this.rootFiber)
  }

  private state?: 'used' | 'discarded'

  discared() {
    this.checkState()
    this.state = 'discarded'
  }
  private checkState() {
    if (this.state) {
      throw new Error(`this envmodel is in state of ${this.state}`)
    }
  }
  /**本次等待删除的fiber*/
  private readonly deletions: StateHolder[] = []
  addDelete(fiber: StateHolder) {
    this.checkState()
    this.deletions.push(fiber)
  }
  private updateEffects = new Map<number, EmptyFun[]>()
  readonly updateEffect = (level: number, set: EmptyFun) => {
    this.checkState()
    effectsAddLevel(this.updateEffects, level, set)
  }
  /**批量提交需要最终确认的atoms */
  commitChange(fun: EmptyFun): void {
    this.checkState()
    this.updateEffect(-Infinity, fun)
  }

  private index = 1
  getIndex() {
    return this.index
  }
  addIndex() {
    if (this.beginRender) {
      throw new Error('已经render了不允许自增')
    }
    return this.index++
  }
  constructor(
    readonly level: LoopWorkLevel,
    private rootFiber: Fiber,
    private commitWork: EmptyFun,
    readonly appState: AppState,
  ) {
    this.lastCommit = () => {
      this.checkState()
      this.workListIndex++
      this.commitWork()
      this.commit()
      this.state = 'used'
    }
    this.lastCommit.lastJob = true
  }
  private commit() {
    // this.realTime.set(false)

    this.deletions.forEach(this.deleteIt)
    // this.deletions.length = 0

    effectsRunInOrder(this.updateEffects)
    // updateEffects.clear()
  }

  private deleteIt = (fiber: StateHolder) => {
    notifyDel(fiber, this)
  }
}

/**
 * 当前工作结点，返回下一个工作结点
 * 先子，再弟，再父(父的弟)
 * 因为是IMGUI的进化版,只能深度遍历,不能广度遍历.
 * 如果子Fiber有返回值,则是有回流,则对于回流,父组件再怎么处理?像布局,是父组件收到回流,子组件会再render.也许从头绘制会需要这种hooks,只是哪些需要显露给用户
 * 深度遍历,render是前置的,执行完父的render,再去执行子的render,没有穿插的过程,或者后置的处理.亦即虽然子Fiber声明有先后,原则上是可以访问所有父的变量.
 * @param fiber
 * @returns
 */
const performUnitOfWork = deepTravelFiber(function (fiber, env) {
  //当前fiber脏了，需要重新render
  if (fiber.effectTag.get(env)) {
    hookSetBeforeFiber()
    fiber.render(env)
  }
})

/**
 * portal内的节点不会找到portal外，portal外的节点不会找到portal内。
 * 即向前遍历，如果该节点是portal，跳过再向前
 * 向上遍历，如果该节点是portal，不再向上---本来不会再向上。
 * @param fiber
 * @returns
 */

function notifyDel(fiber: StateHolder, envModel: EnvModel) {
  destroyFiber(fiber, envModel)
  fiber.children?.forEach((child) => {
    notifyDel(child, envModel)
  })
}
function destroyFiber(fiber: StateHolder, envModel: EnvModel) {
  fiber.destroyed = true
  const effects = fiber.effects
  if (effects) {
    effects.forEach((effect) => {
      const state = effect.get(envModel)
      envModel.updateEffect(state.level, function () {
        const destroy = state.destroy
        if (destroy) {
          destroy({
            isDestroy: true,
            value: state.value,
            beforeIsInit: state.isInit,
            beforeTrigger: state.deps,
            // setRealTime: envModel.setRealTime,
          })
        }
      })
    })
  }
}

export function deepTravelFiber(call: (Fiber: Fiber, env: EnvModel) => void) {
  return function (fiber: Fiber, env: EnvModel) {
    call(fiber, env)
    const child = fiber.firstChild.get(env)
    if (child) {
      return child
    }
    /**寻找叔叔节点 */
    let nextFiber: Fiber | undefined = fiber
    while (nextFiber) {
      const next = nextFiber.next.get(env)
      if (next) {
        return next
      }
      nextFiber = nextFiber.parent
    }
    return undefined
  }
}
