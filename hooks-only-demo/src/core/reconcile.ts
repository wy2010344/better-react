import { addDelect, addDirty, commitRoot } from "./commitWork"
import { updateFunctionComponent } from "./fc"
import { Fiber } from "./Fiber"
/**
 * 执行fiber
 * @param unitOfWork 
 * @returns 
 */
function workLoop(unitOfWork: Fiber): NextTimeWork {
  const nextUnitOfWork = performUnitOfWork(unitOfWork)
  if (nextUnitOfWork) {
    return () => {
      return workLoop(nextUnitOfWork)
    }
  } else {
    return () => {
      currentTick.on = false
      commitRoot()
    }
  }
}
//当前任务
const currentTick = {
  on: false as boolean,
  // works: [] as EMPTY_FUN[]
}
type EMPTY_FUN = () => void
let rootFiber: Fiber | undefined = undefined
//相当于往线程池中添加一个任务
export type WorkUnit = {
  /**
   * 任务收集不能停止,会动态增加loop和afterLoop
   * loop可以跳过
   * afterLoop不可以减少
   * lowest为最次
   */
  type: "batchCollect" | "afterLoop" | "lowest"
  work: EMPTY_FUN
} | {
  type: "loop"
  work: NextTimeWork
}
export type NextTimeWork = () => (NextTimeWork | void)
//任务列表
const workList: WorkUnit[] = []
export type AskNextTimeWork = (askNextWork: () => REAL_WORK | void) => void
let askNextTimeWork: AskNextTimeWork = () => { }
//异步地执行任务
let asyncAskNextTimeWork: AskNextTimeWork
export function setRootFiber(fiber: Fiber, ask: AskNextTimeWork) {
  asyncAskNextTimeWork = ask
  askNextTimeWork = asyncAskNextTimeWork
  rootFiber = fiber
  addDirty(fiber)
  reconcile()
  return function () {
    if (rootFiber) {
      addDelect(rootFiber)
      reconcile(() => {
        rootFiber = undefined
      })
    }
  }
}

const renderWorks: EMPTY_FUN[] = []
export type REAL_WORK = EMPTY_FUN & {
  isRender?: boolean
}
const addAfter = (fun: NextTimeWork) => {
  return function () {
    const after = fun()
    if (after) {
      renderWorks.unshift(addAfter(after))
    }
  }
}
function getNextWork(): REAL_WORK | void {
  //执行计划任务
  if (renderWorks.length) {
    return function () {
      const work = renderWorks.shift()
      work!()
    }
  }
  //寻找批量任务
  const index = workList.findIndex(v => v.type == 'batchCollect')
  if (index > -1) {
    return function () {
      workList[index].work()
      workList.splice(index, 1)
    }
  }
  //寻找渲染任务
  let loopIndex = -1
  for (let i = workList.length - 1; i > -1 && loopIndex < 0; i--) {
    const work = workList[i]
    if (work.type == 'loop') {
      loopIndex = i
      const realWork: REAL_WORK = function () {
        const next = work.work()
        if (next) {
          renderWorks.push(addAfter(next))
        }
        //寻找渲染后的任务
        for (let i = 0; i < workList.length; i++) {
          const work = workList[i]
          if (work.type == 'afterLoop') {
            renderWorks.push(work.work)
          }
        }
        //清空渲染任务
        for (let i = workList.length - 1; i > -1; i--) {
          const work = workList[i]
          if (work.type == 'loop' || work.type == 'afterLoop') {
            workList.splice(i, 1)
          }
        }
      }
      realWork.isRender = true
      return realWork
    }
  }
  //执行最后的低级任务.低任务生成的loop应该是可以中断的.这里要恢复,不仅仅需要恢复hooks树,还要恢复状态的修改
  if (workList.length > 0) {
    return function () {
      console.log("执行最后的低级任务")
      const nextWork = workList.map(v => v.work)
      workList.length = 0
      nextWork.forEach(v => v())
    }
  }
}

//同步地清空所的的任务
const sycAskNextTimeWork: AskNextTimeWork = (getNextWork) => {
  let work = getNextWork()
  while (work) {
    work()
    work = getNextWork()
  }
}
export function flushSync(fun: () => void) {
  askNextTimeWork = sycAskNextTimeWork
  fun()
  callNextTimeWork()
  askNextTimeWork = asyncAskNextTimeWork
}
function callNextTimeWork() {
  askNextTimeWork(getNextWork)
}


const batchUpdate = {
  on: false,
}
/**
 * 由于是触发的,需要批量触发
 * @param callback 
 */
export function reconcile(callback?: EMPTY_FUN) {
  if (batchUpdate.on) {
    if (callback) {
      workList.push({
        type: "afterLoop",
        work: callback
      })
    }
  } else {
    batchUpdate.on = true
    workList.push({
      type: "batchCollect",
      work() {
        //批量提交
        batchUpdate.on = false
        workList.push({
          type: "loop",
          work() {
            currentTick.on = true
            return workLoop(rootFiber!)
          }
        })
        if (callback) {
          workList.push({
            type: "afterLoop",
            work: callback
          })
        }
      }
    })
    callNextTimeWork()
  }
}

/**
 * 按理说,与flushSync相反,这个是尽量慢
 * 但fun里面仍然是setState,不会减少触发呢
 * @param fun 
 */
export function startTransition(fun: () => void) {
  workList.push({
    type: "lowest",
    work: fun
  })
  callNextTimeWork()
}
/**
 * 当前工作结点，返回下一个工作结点
 * 先子，再弟，再父(父的弟)
 * @param fiber 
 * @returns 
 */
function performUnitOfWork(fiber: Fiber) {
  //当前fiber脏了，需要重新render
  if (fiber.effectTag) {
    if (fiber.effectTag == "DIRTY") {
      addDirty(fiber)
    }
    updateFunctionComponent(fiber)
  }
  if (fiber.child) {
    return fiber.child
  }
  /**寻找叔叔节点 */
  let nextFiber: Fiber | undefined = fiber
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }
    nextFiber = nextFiber.parent
  }
  return undefined
}