import { EMPTY_FUN, EnvModel, LoopWork } from "./commitWork"
import { updateFunctionComponent } from "./fc"
import { Fiber } from "./Fiber"
import { deepTravelFiber } from "./findParentAndBefore"
/**
 * 执行fiber
 * @param unitOfWork 
 * @returns 
 */
function workLoop(envModel: EnvModel, unitOfWork: Fiber): NextTimeWork {
  const nextUnitOfWork = performUnitOfWork(unitOfWork, envModel)
  if (nextUnitOfWork) {
    return () => {
      return workLoop(envModel, nextUnitOfWork)
    }
  } else {
    return () => {
      envModel.currentTick.on = false
      envModel.currentTick.lowRollback.length = 0
      envModel.commit()
    }
  }
}
//相当于往线程池中添加一个任务

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

export type AskNextTimeWork<T> = (askNextWork: (env: T) => REAL_WORK | void) => void
export function setRootFiber(
  envModel: EnvModel
) {
  reconcile(envModel, {})
  return function () {
    if (envModel.rootFiber) {
      envModel.addDelect(envModel.rootFiber)
      reconcile(envModel, {
        afterLoop() {
          envModel.rootFiber = undefined
        }
      })
    }
  }
}
export type REAL_WORK = EMPTY_FUN & {
  isRender?: boolean
}
function addAfter(envModel: EnvModel, fun: NextTimeWork) {
  return function () {
    const after = fun()
    if (after) {
      envModel.renderWorks.unshift(addAfter(envModel, after))
    }
  }
}
function getNextWork(envModel: EnvModel): REAL_WORK | void {
  const workList = envModel.workList
  //寻找批量任务
  const index = workList.findIndex(v => v.type == 'batchCollect')
  if (index > -1) {
    return function () {
      (workList[index] as any).work()
      workList.splice(index, 1)
    }
  }

  if (envModel.currentTick.on && envModel.currentTick.isLow) {
    //寻找是否有渲染任务,如果有,则中断
    const work = findRenderWork(envModel, false)
    if (work) {
      envModel.renderWorks.length = 0
      envModel.rollback()
      const ws = envModel.currentTick.lowRollback
      for (let i = ws.length - 1; i > -1; i--) {
        workList.unshift(ws[i])
      }
      envModel.currentTick.lowRollback.length = 0
      envModel.currentTick.on = false
      console.log("强行中断低优先级任务,执行高优先级")
      return work
    }
  }
  //执行计划任务
  if (envModel.renderWorks.length) {
    return function () {
      const work = envModel.renderWorks.shift()
      work!()
    }
  }
  //寻找渲染任务
  const work = findRenderWork(envModel, false)
  if (work) {
    return work
  }
  //寻找低优先级渲染任务
  const lowWork = findRenderWork(envModel, true)
  if (lowWork) {
    return lowWork
  }
}

function findRenderWork(envModel: EnvModel, isLow: boolean) {
  let loopIndex = -1
  const workList = envModel.workList
  function shouldAdd(work: LoopWork) {
    return (isLow && work.isLow) || (!isLow && !work.isLow)
  }
  for (let i = workList.length - 1; i > -1 && loopIndex < 0; i--) {
    const work = workList[i]
    if (work.type == 'loop' && shouldAdd(work)) {
      loopIndex = i
      const realWork: REAL_WORK = function () {
        envModel.currentTick.on = true
        envModel.currentTick.isLow = isLow
        //寻找渲染前的任务
        for (let i = 0; i < workList.length; i++) {
          const work = workList[i]
          if (work.type == 'loop' && shouldAdd(work)) {
            if (work.beforeWork) {
              envModel.renderWorks.push(work.beforeWork)
            }
            envModel.currentTick.lowRollback.push(work)
          }
        }
        //动态添加渲染任务
        envModel.renderWorks.push(() => {
          if (envModel.hasChangeAtoms()) {
            const next = loopWork(envModel)
            if (next) {
              envModel.renderWorks.push(addAfter(envModel, next))
            }
          }
        })
        //寻找渲染后的任务
        for (let i = 0; i < workList.length; i++) {
          const work = workList[i]
          if (work.type == 'loop' && shouldAdd(work)) {
            if (work.afterWork) {
              envModel.renderWorks.push(work.afterWork)
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



// //同步地清空所的的任务
// const sycAskNextTimeWork: AskNextTimeWork = (envModel, getNextWork) => {
//   let work = getNextWork(envModel)
//   while (work) {
//     work()
//     work = getNextWork(envModel)
//   }
// }

// /**
//  * fun 里面是立即执行的各种setState
//  * @param fun 
//  */
// export function flushSync(fun: () => void) {
//   // askNextTimeWork = sycAskNextTimeWork
//   // fun()
//   // callNextTimeWork()
//   // askNextTimeWork = asyncAskNextTimeWork
// }
function callNextTimeWork(envModel: EnvModel) {
  envModel.askNextTimeWork(getNextWork)
}

function loopWork(envModel: EnvModel) {
  if (envModel.rootFiber) {
    return workLoop(envModel, envModel.rootFiber)
  }
}
/**
 * 由于是触发的,需要批量触发
 * @param callback 
 */
export function reconcile(envModel: EnvModel, {
  beforeLoop,
  afterLoop
}: {
  beforeLoop?: EMPTY_FUN
  afterLoop?: EMPTY_FUN
}) {
  const workList = envModel.workList
  envModel.batchUpdate.works.push({
    type: "loop",
    isLow: currentTaskIsLow,
    beforeWork: beforeLoop,
    afterWork: afterLoop
  })
  if (!envModel.batchUpdate.on) {
    envModel.batchUpdate.on = true
    workList.push({
      type: "batchCollect",
      work() {
        //批量提交
        envModel.batchUpdate.on = false
        envModel.batchUpdate.works.forEach(work => {
          workList.push(work)
        })
        envModel.batchUpdate.works.length = 0
      }
    })
    callNextTimeWork(envModel)
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
 * 如果子Fiber有返回值,则是有回流,则对于回流,父组件再怎么处理?像布局,是父组件收到回流,子组件会再render.也许从头绘制会需要这种hooks,只是哪些需要显露给用户
 * 深度遍历,render是前置的,执行完父的render,再去执行子的render,没有穿插的过程,或者后置的处理.亦即虽然子Fiber声明有先后,原则上是可以访问所有父的变量.
 * @param fiber 
 * @returns 
 */
const performUnitOfWork = deepTravelFiber<EnvModel[]>(function (fiber, envModel) {
  //当前fiber脏了，需要重新render
  if (fiber.effectTag.get()) {
    updateFunctionComponent(envModel, fiber)
  }
})