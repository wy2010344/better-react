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
export type AskNextTimeWork = (workList: EMPTY_FUN[]) => void
let askNextTimeWork: AskNextTimeWork = () => { }
//异步地执行任务
let asyncAskNextTimeWork: AskNextTimeWork
export function setRootFiber(fiber: Fiber, ask: AskNextTimeWork) {
  asyncAskNextTimeWork = ask
  askNextTimeWork = asyncAskNextTimeWork
  rootFiber = fiber
  addDirty(fiber)
  reconcile(() => {
    if (rootFiber) {
      rootFiber = {
        ...rootFiber,
        effectTag: undefined,
        alternate: rootFiber
      }
    }
  })
  return function () {
    if (rootFiber) {
      addDelect(rootFiber)
      reconcile(() => {
        rootFiber = undefined
      })
    }
  }
}
const realWorks: EMPTY_FUN[] = []
const addAfter = (fun: NextTimeWork) => {
  return function () {
    const after = fun()
    if (after) {
      realWorks.unshift(addAfter(after))
    }
  }
}
function checkWork() {
  //寻找批量任务
  const index = workList.findIndex(v => v.type == 'batchCollect')
  if (index > -1) {
    realWorks.push(workList[index].work)
    workList.splice(index, 1)
    //检查
    realWorks.push(checkWork)
    return
  }
  //寻找渲染任务
  let loopIndex = -1
  for (let i = workList.length - 1; i > -1 && loopIndex < 0; i--) {
    const work = workList[i]
    if (work.type == 'loop') {
      loopIndex = i
      realWorks.push(addAfter(work.work))
    }
  }
  //寻找渲染后的任务
  for (let i = 0; i < workList.length; i++) {
    const work = workList[i]
    if (work.type == 'afterLoop') {
      realWorks.push(work.work)
    }
  }
  let needCheck = false
  //清空渲染任务
  for (let i = workList.length - 1; i > -1; i--) {
    const work = workList[i]
    if (work.type == 'loop' || work.type == 'afterLoop') {
      needCheck = true
      workList.splice(i, 1)
    }
  }
  //检查
  if (needCheck) {
    realWorks.push(checkWork)
    return
  }
  //执行最后的低级任务
  if (workList.length > 0) {
    const lowestWorks = workList.map(v => v.work)
    realWorks.push(() => {
      lowestWorks.forEach(work => work())
    })
    workList.length = 0
  }
}

//同步地清空所的的任务
const sycAskNextTimeWork: AskNextTimeWork = (works) => {
  while (works.length) {
    const work = works.shift()
    work!()
  }
}
export function flushSync(fun: () => void) {
  askNextTimeWork = sycAskNextTimeWork
  fun()
  callNextTimeWork()
  askNextTimeWork = asyncAskNextTimeWork
}
function callNextTimeWork() {
  if (realWorks.length == 0) {
    realWorks.push(checkWork)
  }
  askNextTimeWork(realWorks)
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
    updateFunctionComponent(fiber)
  }
  if (fiber.child) {
    if (fiber.child.effectTag == "DIRTY") {
      fiber.child = {
        ...fiber.child,
        alternate: fiber.child
      }
      addDirty(fiber.child)
    }
    return fiber.child
  }
  /**寻找叔叔节点 */
  let nextFiber: Fiber | undefined = fiber
  while (nextFiber) {
    if (nextFiber.sibling) {
      if (nextFiber.sibling.effectTag == "DIRTY") {
        nextFiber.sibling = {
          ...nextFiber.sibling,
          alternate: nextFiber.sibling
        }
        addDirty(nextFiber.sibling)
      }
      return nextFiber.sibling
    }
    nextFiber = nextFiber.parent
  }
  return undefined
}