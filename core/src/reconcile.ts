import { EnvModel, LoopWork, StoreRef } from "./commitWork"
import { updateFunctionComponent } from "./fc"
import { Fiber } from "./Fiber"
import { deepTravelFiber } from "./findParentAndBefore"
import { EmptyFun, storeRef } from "./util"

function getRec1(askNextTimeWork: EmptyFun, appendWork: (work: WorkUnit) => void) {
  let batchUpdateOn = false
  const batchUpdateWorks: LoopWork[] = []
  return function ({
    beforeLoop,
    afterLoop
  }: {
    beforeLoop?: EmptyFun
    afterLoop?: EmptyFun
  }): void {
    batchUpdateWorks.push({
      type: "loop",
      isLow: currentTaskIsLow,
      beforeWork: beforeLoop,
      afterWork: afterLoop
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
    private readonly envModel: EnvModel,
    private layout: () => void
  ) { }
  beginRender(currentTick: CurrentTick, renderWorks: RenderWorks) {
    if (this.envModel.shouldRender() && this.rootFiber) {
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
      renderWork.unshiftWork(function () {
        currentTick.commit()
        that.finishRender()
      })
    }
  }
  private finishRender() {
    this.envModel.commit(this.rootFiber!, this.layout)
  }

  destroy() {
    if (this.rootFiber) {
      const that = this
      this.envModel.addDelect(that.rootFiber)
      this.envModel.reconcile({
        afterLoop() {
          that.rootFiber = undefined as any
        }
      })
    }
  }
}

function buildWorkUnits(
  envModel: EnvModel,
  batchWork: BatchWork
) {
  const workList: WorkUnit[] = []
  const currentTick = new CurrentTick(function (work) {
    workList.unshift(work)
  })
  const renderWorks = new RenderWorks()
  function getBatchWork() {
    const index = workList.findIndex(v => v.type == 'batchCollect')
    if (index > -1) {
      return function () {
        (workList[index] as any).work()
        workList.splice(index, 1)
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
        const realWork: REAL_WORK = function () {
          currentTick.open(isLow)
          //寻找渲染前的任务
          for (let i = 0; i < workList.length; i++) {
            const work = workList[i]
            if (work.type == 'loop' && shouldAdd(work)) {
              if (work.beforeWork) {
                renderWorks.appendWork(work.beforeWork)
              }
              currentTick.appendLowRollback(work)
            }
          }
          //动态添加渲染任务
          renderWorks.appendWork(() => {
            batchWork.beginRender(currentTick, renderWorks)
          })
          //寻找渲染后的任务
          for (let i = 0; i < workList.length; i++) {
            const work = workList[i]
            if (work.type == 'loop' && shouldAdd(work)) {
              if (work.afterWork) {
                renderWorks.appendWork(work.afterWork)
              }
            }
          }
          //清空渲染任务
          for (let i = workList.length - 1; i > -1; i--) {
            const work = workList[i]
            if (work.type == 'loop' && shouldAdd(work)) {
              workList.splice(i, 1)
            }
          }
        }
        realWork.isRender = true
        return realWork
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
          renderWorks.rollback()
          currentTick.rollback()
          envModel.rollback()
          console.log("强行中断低优先级任务,执行高优先级")
          return work
        }
      }
      //执行计划任务
      const renderWork = renderWorks.getFirstWork()
      if (renderWork) {
        return renderWork
      }
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
  private readonly list: EmptyFun[] = []
  rollback() {
    this.list.length = 0
  }
  getFirstWork() {
    const that = this
    if (that.list.length) {
      return function () {
        const work = that.list.shift()
        work!()
      }
    }
  }
  appendWork(work: EmptyFun) {
    this.list.push(work)
  }
  unshiftWork(work: EmptyFun) {
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

//相当于往线程池中添加一个任务

export type WorkUnit = {
  /**
   * 任务收集不能停止,会动态增加loop和afterLoop
   * loop可以跳过
   * beforeLoop不可以减少,每次渲染前
   * afterLoop不可以减少
   * lowest为最次---目前是无法实现的
   */
  type: "batchCollect"
  work: EmptyFun
} | LoopWork

export type AskNextTimeWork = (data: {
  realTime: StoreRef<boolean>
  askNextWork: () => REAL_WORK | void
}) => EmptyFun
export type REAL_WORK = EmptyFun & {
  isRender?: boolean
}

// //同步地清空所的的任务
// const sycAskNextTimeWork: AskNextTimeWork = (envModel, getNextWork) => {
//   let work = getNextWork(envModel)
//   while (work) {
//     work()
//     work = getNextWork(envModel)
//   }
// }

// /**
//  * fun 里面是立即执行的各种setState
//  * @param fun 
//  */
// export function flushSync(fun: () => void) {
//   // askNextTimeWork = sycAskNextTimeWork
//   // fun()
//   // callNextTimeWork()
//   // askNextTimeWork = asyncAskNextTimeWork
// }

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