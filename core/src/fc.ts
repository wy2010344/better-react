import { alawaysFalse, EmptyFun, GetValue } from "wy-helper";
import { Fiber, FiberEvent } from "./Fiber";
import { hookAddResult, hookBeforeFiber, hookBeginTempOps, hookEndTempOps, hookSetBeforeFiber, hookStateHoder, hookTempOps } from "./cache";
import { useBaseMemo } from "./memo";


export function updateFunctionComponent(fiber: Fiber) {
  hookSetBeforeFiber()
  fiber.render()
}


export function renderFiber<T>(
  shouldChange: (a: T, b: T) => any,
  render: (e: FiberEvent<T>) => void,
  deps: T
): Fiber {
  const holder = hookStateHoder()
  let currentFiber: Fiber
  const parentFiber = holder.fiber
  if (holder.firstTime) {
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
          isInit: true
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



  const beforeFiber = hookBeforeFiber()
  currentFiber.before.set(beforeFiber)
  //第一次要标记sibling
  if (beforeFiber) {
    beforeFiber.next.set(currentFiber)
  } else {
    parentFiber.firstChild.set(currentFiber)
  }
  currentFiber.next.set(undefined)
  //一直组装到最后
  parentFiber.lastChild.set(currentFiber)
  hookSetBeforeFiber(currentFiber)

  hookAddResult(currentFiber.subOps)
  return currentFiber
}

function createSubs() {
  return hookTempOps().createSub()
}

/**
 * 内部的成员都挂到某个subOps下,直到延迟的hookAddResult
 * @param render 
 * @returns 
 */
export function renderSubOps(render: EmptyFun) {
  const subOps = useBaseMemo(alawaysFalse, createSubs, undefined)
  const before = hookBeginTempOps(subOps)
  render()
  hookEndTempOps(before)
  return subOps
}