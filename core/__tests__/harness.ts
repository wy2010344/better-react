import { render, TempOps } from '../src/index'
import { EmptyFun } from 'wy-helper'

/**
 * core 层不依赖 DOM,用空实现的 TempReal 就能跑完整的 render/commit 流程。
 */
class FakeReal {
  list: any[] = []
  reset() {
    this.list.length = 0
  }
  add(...vs: any[]) {
    this.list.push(vs)
  }
}

function createFakeOps() {
  return new TempOps(
    () => new FakeReal(),
    () => {},
  )
}

/**
 * 同步调度器:每次触发就原地把工作队列跑空,方便断言。
 * 结构对齐 wy-helper 的 getScheduleAskTime,但去掉时间片与宏任务。
 */
function createSyncAsk() {
  return function ({
    askNextWork,
    getArg,
  }: {
    askNextWork: () => any
    getArg: () => any
  }) {
    let running = false
    let again = false
    let count = 0
    return function flush() {
      if (running) {
        again = true
        return
      }
      running = true
      try {
        do {
          again = false
          let work = askNextWork()
          while (work) {
            // 防止调度器不收敛时测试卡死
            if (++count > 3000) {
              throw new Error('调度器未收敛: 超过 3000 次任务')
            }
            work(getArg())
            work = askNextWork()
          }
        } while (again)
      } finally {
        running = false
      }
    }
  }
}

/**
 * 起一个只走 core 的根节点,返回销毁函数。
 */
export function createTestRoot(renderApp: EmptyFun) {
  return render(
    () => createFakeOps(),
    renderApp,
    createSyncAsk() as any,
  )
}
