import { deepTravelFiber, EnvModel, LoopWork, LoopWorkLevel } from "./commitWork"
import { updateFunctionComponent } from "./fc"
import { Fiber } from "./Fiber"
import { AskNextTimeWork, EmptyFun, NextTimeWork, run } from "wy-helper"


function wrapNextWorkWork(
  envModel: EnvModel,
  getNextWork: () => NextTimeWork | void
) {
  function getWrapWork(lastJob: boolean) {
    const wrapperWork: NextTimeWork = function () {
      const work = getNextWork()
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
  return function () {
    const work = getNextWork()
    if (work) {
      return work.lastJob ? wrapWorkLast : wrapWork
    }
  }
}

export function getReconcile(
  beginRender: BeginRender,
  envModel: EnvModel,
  askWork: AskNextTimeWork
) {
  /**业务的工作队列 */
  const { appendWork,
    getNextWork: originGetNextWork,
    hasFlushWork,
    getFlushWork: originGetFlushWork,
    hasLayoutWork,
    getLayoutWork: originalGetLayoutWork
  } = buildWorkUnits(envModel, beginRender)
  const getNextWork = wrapNextWorkWork(envModel, originGetNextWork)

  envModel.commitAll = function () {
    if (envModel.isOnWork()) {
      throw new Error("render中不能commit all")
    }
    let work = getNextWork()
    while (work) {
      work()
      work = getNextWork()
    }
  }

  const askNextTimeWork = askWork({
    askNextWork: getNextWork,
    realTime: envModel.realTime,
  })

  const getFlushWork = wrapNextWorkWork(envModel, originGetFlushWork)
  const getLayoutWork = wrapNextWorkWork(envModel, originalGetLayoutWork)
  envModel.layoutWork = function () {
    if (hasLayoutWork()) {
      //把实时任务执行了
      let work = getLayoutWork()
      while (work) {
        work()
        work = getLayoutWork()
      }
    }
  }
  envModel.layoutEffect = layoutEffect
  flushWorkMap.set(envModel, function () {
    if (hasFlushWork()) {
      if (envModel.isOnWork()) {
        throw new Error("render中不能commit all")
      }
      //把实时任务执行了
      let work = getFlushWork()
      while (work) {
        work()
        work = getFlushWork()
      }
      //其余任务可能存储,再申请异步
      if (getNextWork()) {
        console.log("继续执行普通任务")
        askNextTimeWork()
      }
    }
  })
  return function (work?: EmptyFun): void {
    appendWork({
      type: "loop",
      level: currentTaskLevel,
      work
    })
    askNextTimeWork()
  }
}

export function batchWork(
  rootFiber: Fiber,
  envModel: EnvModel,
) {
  function workLoop(
    renderWork: RenderWorks,
    unitOfWork: Fiber,
    commitWork: EmptyFun
  ) {
    const nextUnitOfWork = performUnitOfWork(unitOfWork)
    if (nextUnitOfWork) {
      renderWork.appendWork(function () {
        workLoop(renderWork, nextUnitOfWork, commitWork)
      })
    } else {
      const realWork: NextTimeWork = function () {
        commitWork()
        envModel.commit()
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
    beginRender(renderWorks: RenderWorks, commitWork: EmptyFun) {
      if (envModel.shouldRender() && rootFiber) {
        //开始render,不能中止
        workLoop(renderWorks, rootFiber, commitWork)
      }
    },
    destroy() {
      if (rootFiber) {
        flushWorkMap.delete(envModel)
        envModel.addDelect(rootFiber)
        envModel.reconcile(onDestroy)
      }
    }
  }
}


const flushWorkMap = new Map<EnvModel, () => NextTimeWork | void>()
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
    level: LoopWorkLevel
  ) {
    function shouldAdd(work: LoopWork) {
      return work.level == level
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
          currentTick.open(level)
          openAWork()
        }
      }
    }
  }
  const getRenderWorkLow = getTheRenderWork(WorkLevel.Low)
  const getRenderWork = getTheRenderWork(WorkLevel.Normal)
  const getLayoutRenderWork = getTheRenderWork(WorkLevel.Layout)
  const getFlushRenderWork = getTheRenderWork(WorkLevel.Flush)
  function getRollbackWork(level: number, getWork: () => void | EmptyFun) {
    return function () {
      renderWorks.rollback()
      currentTick.rollback()
      envModel.rollback()
      console.log(`执行${level}级任务,中断低优先级`)
      const work = getWork()
      if (work) {
        work()
      }
    }
  }
  const rollBackWorkLow = getRollbackWork(WorkLevel.Low, getRenderWorkLow)
  const rollBackWork = getRollbackWork(WorkLevel.Normal, getRenderWork)
  const rollBackLayoutWork = getRollbackWork(WorkLevel.Layout, getLayoutRenderWork)
  const rollBackWorkFlush = getRollbackWork(WorkLevel.Flush, getFlushRenderWork)
  return {
    appendWork(work: LoopWork) {
      workList.push(work)
    },
    hasFlushWork() {
      return getFlushRenderWork()
    },
    getFlushWork() {
      if (currentTick.level() > WorkLevel.Flush) {
        if (getFlushRenderWork()) {
          return rollBackWorkFlush
        }
      }
      const renderWork = renderWorks.getFirstWork()
      if (renderWork) {
        return renderWork
      }
      const flushWork = getFlushRenderWork()
      if (flushWork) {
        return flushWork
      }
    },
    hasLayoutWork() {
      return getLayoutRenderWork()
    },
    getLayoutWork() {
      if (currentTick.level() > WorkLevel.Layout) {
        if (getLayoutRenderWork()) {
          return rollBackLayoutWork
        }
      }
      const renderWork = renderWorks.getFirstWork()
      if (renderWork) {
        return renderWork
      }
      const layoutWork = getLayoutRenderWork()
      if (layoutWork) {
        return layoutWork
      }
    },
    getNextWork(): NextTimeWork | void {
      if (currentTick.level() > WorkLevel.Normal) {
        /**
         * 如果当前是延迟任务
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
  private on: LoopWorkLevel | 0 = 0
  private lowRollbackList: LoopWork[] = []
  open(level: LoopWorkLevel) {
    this.on = level
  }
  private close() {
    this.on = 0
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
  level() {
    return this.on
  }
}


const WorkLevel = {
  Flush: 1,
  Layout: 2,
  Normal: 3,
  Low: 4
} as const

let currentTaskLevel: LoopWorkLevel = WorkLevel.Normal
/**
 * 按理说,与flushSync相反,这个是尽量慢
 * 但fun里面仍然是setState,不会减少触发呢
 * @param fun 
 */
export function startTransition(fun: () => void) {
  const old = currentTaskLevel
  currentTaskLevel = WorkLevel.Low
  fun()
  currentTaskLevel = old
}

function layoutEffect(fun: EmptyFun) {
  const old = currentTaskLevel
  currentTaskLevel = WorkLevel.Layout
  fun()
  currentTaskLevel = old
}

export function flushSync(fun: () => void) {
  const old = currentTaskLevel
  currentTaskLevel = WorkLevel.Flush
  fun()
  currentTaskLevel = old
  flushWorkMap.forEach(run)
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
const performUnitOfWork = deepTravelFiber(function (fiber) {
  //当前fiber脏了，需要重新render
  if (fiber.effectTag.get()) {
    updateFunctionComponent(fiber)
  }
})