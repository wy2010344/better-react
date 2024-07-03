import { Fiber, FiberEvent } from "./Fiber";
import { draftParentFiber, hookAddFiber, hookAddResult, hookParentFiber, hookStateHoder, hookTempOps, revertParentFiber } from "./cache";


const hookIndex = {
  // effect: 0,
  // memo: 0,
  beforeFiber: undefined as (Fiber | undefined),
}
export function updateFunctionComponent(fiber: Fiber) {
  revertParentFiber()
  hookAddFiber(fiber)
  // hookIndex.effect = 0
  // hookIndex.memo = 0
  hookIndex.beforeFiber = undefined
  fiber.render()
  draftParentFiber();
  hookAddFiber(undefined)
}


export function renderFiber<T>(
  shouldChange: (a: T, b: T) => any,
  render: (e: FiberEvent<T>) => void,
  deps: T
): Fiber {
  const holder = hookStateHoder()
  let currentFiber: Fiber
  const isInit = holder.firstTime
  const parentFiber = holder.fiber
  if (isInit) {
    holder.fibers = holder.fibers || []
    //新增
    currentFiber = Fiber.create(
      holder.envModel,
      parentFiber,
      {
        shouldChange,
        render,
        event: {
          trigger: deps,
          isInit
        }
      })
    currentFiber.subOps = hookTempOps().createSub()
    holder.fibers.push(currentFiber)
  } else {
    if (!holder.fibers) {
      throw new Error("holder上没有fiber")
    }
    currentFiber = holder.fibers[holder.fiberIndex]
    holder.fiberIndex = holder.fiberIndex + 1
    currentFiber.changeRender(shouldChange, render, deps)
  }



  currentFiber.before.set(hookIndex.beforeFiber)
  //第一次要标记sibling
  if (hookIndex.beforeFiber) {
    hookIndex.beforeFiber.next.set(currentFiber)
  } else {
    parentFiber.firstChild.set(currentFiber)
  }
  currentFiber.next.set(undefined)
  //一直组装到最后
  parentFiber.lastChild.set(currentFiber)
  hookIndex.beforeFiber = currentFiber

  hookAddResult(currentFiber.subOps)
  return currentFiber
}


export function hookEffectTag() {
  const parentFiber = hookParentFiber()
  return parentFiber.effectTag.get()!
}


export function hookCommitAll() {
  const parentFiber = hookParentFiber()
  return parentFiber.envModel.commitAll
}

export function hookCreateChangeAtom() {
  const parentFiber = hookParentFiber()
  return parentFiber.envModel.createChangeAtom
}