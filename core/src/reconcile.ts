import { addDelect, addDirty, commitRoot } from "./commitWork"
import { updateFunctionComponent } from "./fc"
import { Fiber } from "./Fiber"
let nextUnitOfWork: Fiber | undefined = undefined
/**
 * 循环更新界面
 * @param deadline 
 */
function workLoop(shouldContinue: () => boolean) {
  let willContinue = true
  while (willContinue && nextUnitOfWork) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
    willContinue = shouldContinue()
  }
  if (nextUnitOfWork) {
    askNextTimeWork(workLoop)
  } else {
    currentTick.on = 'commit'
    commitRoot()
    //执行所有的当前任务
    for (const tick of currentTick.works) {
      tick()
    }
    if (nextTick.on) {
      currentTick.works = nextTick.works
      nextTick.on = false
      nextTick.works = []
      //重置更新,下一次执行所有currentTicks,nextTick待更新
      nextUnitOfWork = rootFiber
      askNextTimeWork(workLoop)
    } else {
      currentTick.on = false
      currentTick.works = []
    }
  }
}
//当前任务
const currentTick = {
  on: false as boolean | "commit",
  works: [] as EMPTY_FUN[]
}
//下一次的任务
const nextTick = {
  on: false,
  works: [] as EMPTY_FUN[]
}
type EMPTY_FUN = () => void

let rootFiber: Fiber | undefined = undefined
export type AskNextTimeWork = (v: (v: () => boolean) => void) => void
let askNextTimeWork: AskNextTimeWork = () => { }
export function setRootFiber(fiber: Fiber, ask: AskNextTimeWork) {
  askNextTimeWork = ask
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
/**deadline.timeRemaining() > 1
 * 被通知去找到最新的根节点，并计算
 */
export function reconcile(callback?: EMPTY_FUN) {
  if (callback) {
    tempWorks.push(callback)
  }
  askTempWork()
}
/**
 * 如果一个事件中有多次setState,
 *  第一次为初始化触发,
 *  第二次、N次则为进入触发,就会render两次.
 * 不是用promise做到微任务,最好是做到空闲执行.
 * 所以一次事件,只执行一次收集.
 */
//本批次只会执行这一个任务
let tempWorks: EMPTY_FUN[] = []
let askedTempWork = false
function askTempWork() {
  if (askedTempWork) {
    return
  }
  askedTempWork = true
  askNextTimeWork(() => {
    //空闲时间再来处理
    if (currentTick.on) {
      nextTick.on = true
      for (const work of tempWorks) {
        nextTick.works.push(work)
      }
    } else {
      currentTick.on = true
      currentTick.works = tempWorks
      //重置更新
      nextUnitOfWork = rootFiber
      askNextTimeWork(workLoop)
    }
    tempWorks = []
    askedTempWork = false
  })
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
