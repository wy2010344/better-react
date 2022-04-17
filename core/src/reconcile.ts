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
    commitRoot()
    afterRenderSet.forEach(afterRender => afterRender())

    doWork = false
    if (nextJob) {
      nextJob = false
      reconcile()
    }
  }
}
//是否正在工作中
let doWork = false
//是否有下一次任务
let nextJob = false

let rootFiber: Fiber | undefined = undefined
export type AskNextTimeWork = (v: (v: () => boolean) => void) => void
let askNextTimeWork: AskNextTimeWork = () => { }
/**每次render后调用，可以用于Layout动画之类的，在useEffect里监听与移除*/
export const afterRenderSet = new Set<() => void>()
export function setRootFiber(fiber: Fiber, ask: AskNextTimeWork) {
  askNextTimeWork = ask
  rootFiber = fiber
  addDirty(fiber)
  const afterRender = function () {
    if (rootFiber) {
      rootFiber = {
        ...rootFiber,
        effectTag: undefined,
        alternate: rootFiber
      }
    }
    afterRenderSet.delete(afterRender)
  }
  afterRenderSet.add(afterRender)
  reconcile()
  return function () {
    if (rootFiber) {
      addDelect(rootFiber)
      const afterRender = function () {
        rootFiber = undefined
        afterRenderSet.delete(afterRender)
      }
      afterRenderSet.add(afterRender)
      reconcile()
    }
  }
}
/**deadline.timeRemaining() > 1
 * 被通知去找到最新的根节点，并计算
 */
export function reconcile() {
  if (doWork) {
    nextJob = true
  } else {
    doWork = true
    nextUnitOfWork = rootFiber
    askNextTimeWork(workLoop)
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
