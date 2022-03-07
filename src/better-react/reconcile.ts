import { addDirty, commitRoot } from "./commitWork"
import { updateFunctionComponent } from "./fc"
import { Fiber } from "./Fiber"
import { reconcileChildren } from "./reconcileChildren"
import { reconcileRepeat } from "./reconcileRepeat"
import { createDom } from "./updateDom"
let nextUnitOfWork: Fiber | undefined = undefined
/**
 * 循环更新界面
 * @param deadline 
 */
function workLoop(deadline: IdleDeadline) {
  let willContinue = true
  while (willContinue && nextUnitOfWork) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
    willContinue = deadline.timeRemaining() > 1
  }
  if (nextUnitOfWork) {
    requestIdleCallback(workLoop)
  } else {
    commitRoot()
    //rootFiber.dirty = false
    afterRenderSet.forEach(afterRender => afterRender())
  }
}
let rootFiber: Fiber
/**每次render后调用，可以用于Layout动画之类的，在useEffect里监听与移除*/
export const afterRenderSet = new Set<() => void>()
export function setRootFiber(fiber: Fiber) {
  rootFiber = fiber
  const afterRender = function () {
    rootFiber = {
      ...rootFiber,
      effectTag: undefined,
      alternate: rootFiber
    }
    afterRenderSet.delete(afterRender)
  }
  afterRenderSet.add(afterRender)
}
/**
 * 被通知去找到最新的根节点，并计算
 */
export function reconcile() {
  nextUnitOfWork = rootFiber
  requestIdleCallback(workLoop);
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
    const isFunctionComponent = fiber.type instanceof Function
    if (isFunctionComponent) {
      updateFunctionComponent(fiber)
    } else if (fiber.array) {
      //列表生成元素
      reconcileRepeat(fiber)
    } else {
      //普通元素，包括根元素
      updateHostComponent(fiber)
    }
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
/**
 * 更新原始dom节点
 * @param fiber 
 */
function updateHostComponent(fiber: Fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }
  reconcileChildren(fiber, fiber.props?.children)
}
