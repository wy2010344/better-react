import { EnvModel, LoopWork, StoreRef } from "./commitWork"
import { updateFunctionComponent } from "./fc"
import { Fiber } from "./Fiber"
import { deepTravelFiber } from "./findParentAndBefore"
import { EmptyFun } from "./util"

function getRec1(askNextTimeWork: EmptyFun, appendWork: (work: WorkUnit) => void) {
  let batchUpdateOn = false
  const batchUpdateWorks: LoopWork[] = []
  return function (work?: EmptyFun): void {
    batchUpdateWorks.push({
      type: "loop",
      isLow: currentTaskIsLow,
      work
    })
    if (!batchUpdateOn) {
      batchUpdateOn = true
      appendWork({
        type: "batchCollect",
        work() {
          //批量提交
          batchUpdateOn = false
          batchUpdateWorks.forEach(work => {
            appendWork(work)
          })
          batchUpdateWorks.length = 0
        }
      })
      askNextTimeWork()
    }
  }
}
export function getReconcile(
  batchWork: BatchWork,
  envModel: EnvModel,
  askWork: AskNextTimeWork
) {
  /**业务的工作队列 */
  const { appendWork, getNextWork } = buildWorkUnits(envModel, batchWork)
  const askNextTimeWork = askWork({
    askNextWork: getNextWork,
    realTime: envModel.realTime,
  })
  return getRec1(askNextTimeWork, appendWork)
}
/**
 * 顶层全局
 */
export class BatchWork {
  constructor(
    private rootFiber: Fiber,
    private readonly envModel: EnvModel
  ) { }
  beginRender(currentTick: CurrentTick, renderWorks: RenderWorks) {
    if (this.envModel.shouldRender() && this.rootFiber) {
      this.envModel.beginRender()
      this.workLoop(renderWorks, currentTick, this.rootFiber)
    }
  }
  private workLoop(
    renderWork: RenderWorks,
    currentTick: CurrentTick,
    unitOfWork: Fiber
  ) {
    const that = this
    const nextUnitOfWork = performUnitOfWork(unitOfWork, that.envModel)
    if (nextUnitOfWork) {
      renderWork.unshiftWork(function () {
        that.workLoop(renderWork, currentTick, nextUnitOfWork)
      })
    } else {
      const realWork: REAL_WORK = function () {
        currentTick.commit()
        that.finishRender()
      }
      realWork.isRender = true
      renderWork.unshiftWork(realWork)
    }
  }
  private finishRender() {
    this.envModel.commit(this.rootFiber!)
  }

  destroy() {
    if (this.rootFiber) {
      const that = this
      this.envModel.addDelect(that.rootFiber)
      this.envModel.reconcile(function () {
        that.envModel.updateEffect(0, function () {
          that.rootFiber = undefined as any
        })
      })
    }
  }
}

function buildWorkUnits(
  envModel: EnvModel,
  batchWork: BatchWork
) {
  let workList: WorkUnit[] = []
  const currentTick = new CurrentTick(function (work) {
    workList.unshift(work)
  })
  const renderWorks = new RenderWorks()
  function getBatchWork() {
    const index = workList.findIndex(v => v.type == 'batchCollect')
    if (index > -1) {
      return function () {
        const work = workList.splice(index, 1)[0] as BatchCollectWork
        work.work()
      }
    }
  }
  function getRenderWork(
    isLow: boolean
  ) {
    // const that = this
    let loopIndex = -1
    function shouldAdd(work: LoopWork) {
      return (isLow && work.isLow) || (!isLow && !work.isLow)
    }
    for (let i = workList.length - 1; i > -1 && loopIndex < 0; i--) {
      const work = workList[i]
      if (work.type == 'loop' && shouldAdd(work)) {
        loopIndex = i
        return function () {
          currentTick.open(isLow)
          //寻找渲染前的任务
          workList = workList.filter(function (work, i) {
            if (work.type == 'loop' && shouldAdd(work)) {
              if (work.work) {
                renderWorks.appendWork(work.work)
              }
              currentTick.appendLowRollback(work)
              return false
            }
            return true
          })
          //动态添加渲染任务
          renderWorks.appendWork(() => {
            batchWork.beginRender(currentTick, renderWorks)
          })
        }
      }
    }
  }

  return {
    appendWork(work: WorkUnit) {
      workList.push(work)
    },
    getNextWork() {
      //寻找批量任务
      const collectWork = getBatchWork()
      if (collectWork) {
        return collectWork
      }
      if (currentTick.isOnLow()) {
        //寻找是否有渲染任务,如果有,则中断
        const work = getRenderWork(false)
        if (work) {
          //这里只是ask,没有回滚吧
          renderWorks.rollback()
          currentTick.rollback()
          envModel.rollback()
          console.log("强行中断低优先级任务,执行高优先级")
          return work
        }
      }
      //执行计划的渲染任务
      const renderWork = renderWorks.getFirstWork()
      if (renderWork) {
        return renderWork
      }
      //@todo 渲染后的任务可以做在这里....

      //寻找渲染任务
      const work = getRenderWork(false)
      if (work) {
        return work
      }
      //寻找低优先级渲染任务
      const lowWork = getRenderWork(true)
      if (lowWork) {
        return lowWork
      }
    }
  }
}
class RenderWorks {
  private readonly list: REAL_WORK[] = []
  rollback() {
    this.list.length = 0
  }
  getFirstWork() {
    const that = this
    if (that.list.length) {
      const retWork: REAL_WORK = function () {
        const work = that.list.shift()
        work!()
      }
      retWork.isRender = this.list[0]?.isRender
      return retWork
    }
  }
  appendWork(work: EmptyFun) {
    this.list.push(work)
  }
  unshiftWork(work: REAL_WORK) {
    this.list.unshift(work)
  }
}
class CurrentTick {
  constructor(
    private rollbackWork: (work: LoopWork) => void
  ) { }
  private on = false
  private isLow = false
  private lowRollbackList: LoopWork[] = []
  open(isLow: boolean) {
    this.on = true
    this.isLow = isLow
  }
  private close() {
    this.on = false
    this.lowRollbackList.length = 0
  }
  appendLowRollback(work: LoopWork) {
    this.lowRollbackList.push(work)
  }
  commit() {
    this.close()
  }
  rollback() {
    const ws = this.lowRollbackList
    for (let i = ws.length - 1; i > -1; i--) {
      this.rollbackWork(ws[i])
    }
    this.close()
  }
  isOnLow() {
    return this.on && this.isLow
  }
}

export type BatchCollectWork = {
  /**
   * 任务收集不能停止,会动态增加loop和afterLoop
   * loop可以跳过
   * beforeLoop不可以减少,每次渲染前
   * afterLoop不可以减少
   * lowest为最次---目前是无法实现的
   */
  type: "batchCollect"
  work: EmptyFun
}
//相当于往线程池中添加一个任务
export type WorkUnit = BatchCollectWork | LoopWork

export type AskNextTimeWork = (data: {
  realTime: StoreRef<boolean>
  askNextWork: () => REAL_WORK | void
}) => EmptyFun
export type REAL_WORK = EmptyFun & {
  isRender?: boolean
}

let currentTaskIsLow = false
/**
 * 按理说,与flushSync相反,这个是尽量慢
 * 但fun里面仍然是setState,不会减少触发呢
 * @param fun 
 */
export function startTransition(fun: () => void) {
  currentTaskIsLow = true
  fun()
  currentTaskIsLow = false
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
const performUnitOfWork = deepTravelFiber<EnvModel[]>(function (fiber, envModel) {
  //当前fiber脏了，需要重新render
  if (fiber.effectTag.get()) {
    updateFunctionComponent(envModel, fiber)
  }
})