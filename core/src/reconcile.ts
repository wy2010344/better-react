import { addAdd, addDelect, commitRoot, rollback } from "./commitWork"
import { updateFunctionComponent } from "./fc"
import { Fiber, getData, isWithDraftFiber } from "./Fiber"
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
      currentTick.lowRollback.length = 0
      commitRoot()
    }
  }
}
//当前任务
const currentTick = {
  on: false as boolean,
  //当前执行的render任务是否是低优先级的
  isLow: false as boolean,
  //提交的任务
  lowRollback: [] as LoopWork[]
}
type EMPTY_FUN = () => void
let rootFiber: Fiber | undefined = undefined
//相当于往线程池中添加一个任务
type LoopWork = {
  type: "loop"
  //是否是低优先级
  isLow?: boolean
  beforeWork?: EMPTY_FUN
  afterWork?: EMPTY_FUN
}
export type WorkUnit = {
  /**
   * 任务收集不能停止,会动态增加loop和afterLoop
   * loop可以跳过
   * beforeLoop不可以减少,每次渲染前
   * afterLoop不可以减少
   * lowest为最次---目前是无法实现的
   */
  type: "batchCollect"
  work: EMPTY_FUN
} | LoopWork
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
  addAdd(fiber)
  reconcile({})
  return function () {
    if (rootFiber) {
      addDelect(rootFiber)
      reconcile({
        afterLoop() {
          rootFiber = undefined
        }
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
  //寻找批量任务
  const index = workList.findIndex(v => v.type == 'batchCollect')
  if (index > -1) {
    return function () {
      (workList[index] as any).work()
      workList.splice(index, 1)
    }
  }

  if (currentTick.on && currentTick.isLow) {
    //寻找是否有渲染任务,如果有,则中断
    const work = findRenderWork(false)
    if (work) {
      renderWorks.length = 0
      rollback()
      const ws = currentTick.lowRollback
      for (let i = ws.length - 1; i > -1; i--) {
        workList.unshift(ws[i])
      }
      currentTick.lowRollback.length = 0
      currentTick.on = false
      console.log("强行中断低优先级任务,执行高优先级")
      return work
    }
  }
  //执行计划任务
  if (renderWorks.length) {
    return function () {
      const work = renderWorks.shift()
      work!()
    }
  }
  //寻找渲染任务
  const work = findRenderWork(false)
  if (work) {
    return work
  }
  //寻找低优先级渲染任务
  const lowWork = findRenderWork(true)
  if (lowWork) {
    return lowWork
  }
}

function findRenderWork(isLow: boolean) {
  let loopIndex = -1
  function shouldAdd(work: LoopWork) {
    return (isLow && work.isLow) || (!isLow && !work.isLow)
  }
  for (let i = workList.length - 1; i > -1 && loopIndex < 0; i--) {
    const work = workList[i]
    if (work.type == 'loop' && shouldAdd(work)) {
      loopIndex = i
      const realWork: REAL_WORK = function () {
        currentTick.on = true
        currentTick.isLow = isLow
        //寻找渲染前的任务
        for (let i = 0; i < workList.length; i++) {
          const work = workList[i]
          if (work.type == 'loop' && shouldAdd(work)) {
            if (work.beforeWork) {
              renderWorks.push(work.beforeWork)
            }
            currentTick.lowRollback.push(work)
          }
        }
        //动态添加渲染任务
        renderWorks.push(() => {
          const next = loopWork()
          if (next) {
            renderWorks.push(addAfter(next))
          }
        })
        //寻找渲染后的任务
        for (let i = 0; i < workList.length; i++) {
          const work = workList[i]
          if (work.type == 'loop' && shouldAdd(work)) {
            if (work.afterWork) {
              renderWorks.push(work.afterWork)
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
  works: [] as LoopWork[]
}

function loopWork() {
  if (rootFiber) {
    return workLoop(rootFiber)
  }
}
/**
 * 由于是触发的,需要批量触发
 * @param callback 
 */
export function reconcile({
  beforeLoop,
  afterLoop
}: {
  beforeLoop?: EMPTY_FUN
  afterLoop?: EMPTY_FUN
}) {
  batchUpdate.works.push({
    type: "loop",
    isLow: currentTaskIsLow,
    beforeWork: beforeLoop,
    afterWork: afterLoop
  })
  if (!batchUpdate.on) {
    batchUpdate.on = true
    workList.push({
      type: "batchCollect",
      work() {
        //批量提交
        batchUpdate.on = false
        batchUpdate.works.forEach(work => {
          workList.push(work)
        })
        batchUpdate.works.length = 0
      }
    })
    callNextTimeWork()
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
 * @param fiber 
 * @returns 
 */
function performUnitOfWork(fiber: Fiber) {
  //当前fiber脏了，需要重新render
  if (isWithDraftFiber(fiber)) {
    updateFunctionComponent(fiber)
    if (fiber.draft.child) {
      return fiber.draft.child
    }
  } else {
    if (fiber.current.child) {
      return fiber.current.child
    }
  }

  /**寻找叔叔节点 */
  let nextFiber: Fiber | undefined = fiber
  while (nextFiber) {
    const propData = getData(nextFiber)
    if (propData.sibling) {
      return propData.sibling
    }
    nextFiber = nextFiber.parent
  }
  return undefined
}