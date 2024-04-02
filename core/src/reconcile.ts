import { deepTravelFiber, EnvModel, LoopWork } from "./commitWork"
import { updateFunctionComponent } from "./fc"
import { FiberImpl } from "./Fiber"
import { AskNextTimeWork, EmptyFun, NextTimeWork } from "wy-helper"
export function getReconcile(
  beginRender: BeginRender,
  envModel: EnvModel,
  askWork: AskNextTimeWork
) {
  /**业务的工作队列 */
  const { appendWork, getNextWork: originGetNextWork } = buildWorkUnits(envModel, beginRender)
  function getWrapWork(lastJob: boolean) {
    const wrapperWork: NextTimeWork = function () {
      const work = originGetNextWork()
      if (work) {
        envModel.setOnWork(work.lastJob)
        work()
        envModel.finishWork()
      }
    }
    wrapperWork.lastJob = lastJob
    return wrapperWork
  }
  const wrapWorkLast = getWrapWork(true)
  const wrapWork = getWrapWork(false)
  function getNextWork() {
    const work = originGetNextWork()
    if (work) {
      return work.lastJob ? wrapWorkLast : wrapWork
    }
  }
  envModel.getNextWork = getNextWork
  const askNextTimeWork = askWork({
    askNextWork: getNextWork,
    realTime: envModel.realTime,
  })
  return function (work?: EmptyFun): void {
    appendWork({
      type: "loop",
      isLow: currentTaskIsLow,
      work
    })
    askNextTimeWork()
  }
}

export function batchWork(
  rootFiber: FiberImpl,
  envModel: EnvModel,
) {
  function workLoop(
    renderWork: RenderWorks,
    unitOfWork: FiberImpl,
    commitWork: NextTimeWork
  ) {
    const nextUnitOfWork = performUnitOfWork(unitOfWork, envModel)
    if (nextUnitOfWork) {
      renderWork.appendWork(function () {
        workLoop(renderWork, nextUnitOfWork, commitWork)
      })
    } else {
      const realWork: NextTimeWork = function () {
        commitWork()
        envModel.commit(rootFiber!)
      }
      realWork.lastJob = true
      renderWork.appendWork(realWork)
    }
  }
  function clearFiber() {
    rootFiber = undefined as any
  }
  function onDestroy() {
    envModel.updateEffect(0, clearFiber)
  }
  return {
    beginRender(renderWorks: RenderWorks, commitWork: NextTimeWork) {
      if (envModel.shouldRender() && rootFiber) {
        //开始render,不能中止
        workLoop(renderWorks, rootFiber, commitWork)
      }
    },
    destroy() {
      if (rootFiber) {
        envModel.addDelect(rootFiber)
        envModel.reconcile(onDestroy)
      }
    }
  }
}
/**
 * 顶层全局
 */

type BeginRender = (renderWorks: RenderWorks, commitWork: EmptyFun) => void
function buildWorkUnits(
  envModel: EnvModel,
  beginRender: BeginRender
) {
  let workList: LoopWork[] = []
  const currentTick = new CurrentTick(function (work) {
    workList.unshift(work)
  })
  const renderWorks = new RenderWorks()
  function commitWork() {
    currentTick.commit()
  }

  function getTheRenderWork(
    isLow: boolean
  ) {
    function shouldAdd(work: LoopWork) {
      return (isLow && work.isLow) || (!isLow && !work.isLow)
    }
    //寻找渲染前的任务
    function openAWork() {
      if (workList.some(shouldAdd)) {
        workList = workList.filter(work => {
          if (shouldAdd(work)) {
            if (work.work) {
              renderWorks.appendWork(work.work)
            }
            currentTick.appendLowRollback(work)
            return false
          }
          return true
        })
        //等到所有执行完,再检查一次.
        renderWorks.appendWork(openAWork)
      } else {
        beginRender(renderWorks, commitWork)
      }
    }
    return function () {
      if (workList.some(shouldAdd)) {
        return function () {
          currentTick.open(isLow)
          openAWork()
        }
      }
    }
  }
  const getRenderWorkLow = getTheRenderWork(true)
  const getRenderWork = getTheRenderWork(false)
  function getRollbackWork(isLow: boolean, getWork: () => void | EmptyFun) {
    return function () {
      renderWorks.rollback()
      currentTick.rollback()
      envModel.rollback()
      if (isLow) {
        console.log("有新的低优先级任务出现,中断之前的低优先级")
      } else {
        console.log("强行中断低优先级任务,执行高优先级")
      }
      const work = getWork()
      if (work) {
        work()
      }
    }
  }
  const rollBackWorkLow = getRollbackWork(true, getRenderWorkLow)
  const rollBackWork = getRollbackWork(false, getRenderWork)
  return {
    appendWork(work: LoopWork) {
      workList.push(work)
    },
    getNextWork(): NextTimeWork | void {
      if (currentTick.isOnLow()) {
        /**
         * 寻找是否有渲染任务,如果有,则中断
         * 如果有新的lazywork,则也优先
         */
        if (getRenderWork()) {
          return rollBackWork
        }
        if (getRenderWorkLow()) {
          return rollBackWorkLow
        }
      }
      //执行计划的渲染任务
      const renderWork = renderWorks.getFirstWork()
      if (renderWork) {
        return renderWork
      }
      //@todo 渲染后的任务可以做在这里....
      //寻找渲染任务
      const work = getRenderWork()
      if (work) {
        return work
      }
      //寻找低优先级渲染任务
      const lowWork = getRenderWorkLow()
      if (lowWork) {
        return lowWork
      }
    }
  }
}
class RenderWorks {
  private getRetWork(lastJob: boolean) {
    const that = this
    const retWork: NextTimeWork = function () {
      const work = that.list.shift()
      work!()
    }
    retWork.lastJob = lastJob
    return retWork
  }
  private lastRetWork = this.getRetWork(true)
  private retWork = this.getRetWork(false)
  private readonly list: NextTimeWork[] = []
  rollback() {
    this.list.length = 0
  }
  getFirstWork() {
    const that = this
    if (that.list.length) {
      return this.list[0]?.lastJob
        ? this.lastRetWork
        : this.retWork
    }
  }
  appendWork(work: NextTimeWork) {
    this.list.push(work)
  }
}
class CurrentTick {
  constructor(
    private rollbackWork: (work: LoopWork) => void
  ) { }
  private on: boolean | 'low' = false
  private lowRollbackList: LoopWork[] = []
  open(isLow: boolean) {
    this.on = isLow ? 'low' : true
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
    return this.on == 'low'
  }
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
    updateFunctionComponent(fiber)
  }
})