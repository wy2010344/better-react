import { addDelect, addDirty, clearWork, commitRoot } from "./commitWork"
import { updateFunctionComponent } from "./fc"
import { Fiber } from "./Fiber"
let nextUnitOfWork: Fiber | undefined = undefined
/**
 * 循环更新界面
 * @param shouldContinue 
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
    askNextTimeWork(commitWork)
  }
}
function commitWork() {
  revertDirtyList.length = 0
  currentTick.on = false
  commitRoot()
  //执行所有的当前任务
  for (const tick of currentTick.works) {
    tick()
  }
  currentTick.works.length = 0
}
//当前任务
const currentTick = {
  on: false as boolean,
  works: [] as EMPTY_FUN[]
}
type EMPTY_FUN = () => void

let rootFiber: Fiber | undefined = undefined
//相当于往线程池中添加一个任务
export type AskNextTimeWork = (v: (v: () => boolean) => void) => void
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
//同步地执行任务
const sycAskNextTimeWork: AskNextTimeWork = (call) => {
  call(() => true)
}
export function flushSync(fun: () => void) {
  askNextTimeWork = sycAskNextTimeWork
  fun()
  askNextTimeWork = asyncAskNextTimeWork
}


const batchUpdate = {
  on: false,
  works: [] as EMPTY_FUN[]
}
/**
 * 由于是触发的,需要批量触发
 * @param callback 
 */
export function reconcile(callback?: EMPTY_FUN) {
  if (batchUpdate.on) {
    if (callback) {
      batchUpdate.works.push(callback)
    }
  } else {
    batchUpdate.on = true
    askNextTimeWork((shouldContinue) => {
      //批量提交
      batchUpdate.on = false
      const works = batchUpdate.works
      batchUpdate.works = []
      if (currentTick.on) {
        //没有时间了,先把之前的执行完,当前任务完成后,再执行
        currentTick.works.push(() => {
          askNextTimeWork(() => {
            currentTick.on = true
            currentTick.works = works
            //重置更新
            nextUnitOfWork = rootFiber
            askNextTimeWork(workLoop)
          })
        })
        // if (shouldContinue()) {
        //   //仍然有时间,重新执行吧  这里的恢复存在问题
        //   //恢复仍然存在问题
        //   revertFiber()
        //   clearWork()
        //   works.forEach(work => currentTick.works.push(work))
        //   //重置更新
        //   nextUnitOfWork = rootFiber
        //   askNextTimeWork(workLoop)
        // } else {
        //   //没有时间了,先把之前的执行完,当前任务完成后,再执行
        //   currentTick.works.push(() => {
        //     askNextTimeWork(() => {
        //       currentTick.on = true
        //       currentTick.works = works
        //       //重置更新
        //       nextUnitOfWork = rootFiber
        //       askNextTimeWork(workLoop)
        //     })
        //   })
        // }
      } else {
        currentTick.on = true
        currentTick.works = works
        //重置更新
        nextUnitOfWork = rootFiber
        askNextTimeWork(workLoop)
      }
    })
  }
}

export function startTransition(fun: () => void) {
  if (currentTick.on) {
    currentTick.works.push(fun)
  } else {
    fun()
  }
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
      revertDirtyList.push({
        type: "child",
        fiber,
        subFiber: fiber.child
      })
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
        revertDirtyList.push({
          type: "sibling",
          fiber: nextFiber,
          subFiber: nextFiber.sibling
        })
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

export const revertDirtyList: {
  type: "child" | "sibling" | "parent"
  fiber: Fiber
  subFiber: Fiber
}[] = []
//仍然存在问题!!
function revertFiber() {
  for (const revert of revertDirtyList) {
    if (revert.type == 'child') {
      revert.fiber.child = revert.subFiber
    } else if (revert.type == 'sibling') {
      revert.fiber.sibling = revert.subFiber
    } else if (revert.type == 'parent') {
      revert.fiber.parent = revert.subFiber
    }
  }
  revertDirtyList.length = 0
}