import { createRoot } from "better-react-dom";
import insideAnimation from "./insideAnimation/frameLayout";
// import iScroll from "./iScroll/index";
import iScroll from "./iScroll/myScrollFrame";
// import { requestAnimationFrameScheduler } from "better-react-dom";
import ExpensiveViewSingle from "./ExpensiveViewSingle";
import { AskNextTimeWork, EmptyFun, NextTimeWork, createRunSyncTasks, emptyArray, emptyObject, getCurrentTimePerformance, messageChannelCallback } from "wy-helper";
import indexDB from "./indexDB";
import cssLayout from "./insideAnimation/cssLayout";
import demo1 from "./better-scroll/demo1";
import { renderPages } from "./开发AnimatePereference/renderPages";
import { renderFilter } from "./开发AnimatePereference/renderFilter";
import { useVersion } from "better-react-helper";
import bezierPreview from "./bezier-preview";
import reorderList from "./insideAnimation/reorderList";
import dslKanren from "./dsl-kanren";
import newMode from "./newMode";
import canvasRender from "./newMode/canvasRender";
export function createBr(app: HTMLElement) {

  const destroy = createRoot(
    app,
    // dslKanren,
    // renderPages,
    // demo,
    // renderFilter,
    // cssLayout,
    // reorderList,
    canvasRender,
    // insideAnimation,
    // indexDB,
    // iScroll,
    // newMode,
    // bezierPreview,
    // ExpensiveViewSingle,
    // reanimated,
    // demo1,
    //askTimeWork,
    //askIdleTimeWork,
    // askTimeWork,
    // requestAnimationFrameScheduler
    getScheduleAskTime({
      limitFlush: requestAnimationFrame
    })
  );
}




/**
 * 提前执行掉一些工作,却可能回滚
 * @param param0 
 * @returns 
 */
export function getScheduleAskTime({
  taskTimeThreadhold = 5,
  limitFlush
}: {
  taskTimeThreadhold?: number
  limitFlush?(fun: EmptyFun): void
} = emptyObject): AskNextTimeWork {
  const runTaskSync = createRunSyncTasks()

  function logWorkCost(work: NextTimeWork) {
    let a = getCurrentTimePerformance()
    work()
    const b = getCurrentTimePerformance()
    if (b - a > taskTimeThreadhold) {
      console.log("warn-cost more", b - a, work.lastJob)
    }
  }
  return function ({
    askNextWork,
    realTime
  }) {
    let onWork = false
    /**
     * 执行queue中的任务
     * 本次没执行完,下次执行.
     * 下次一定需要在宏任务中执行
     */
    const flush = () => {
      const deadline = getCurrentTimePerformance() + taskTimeThreadhold
      let callback = askNextWork()
      while (callback) {
        if (realTime.get()) {
          logWorkCost(callback)
          callback = askNextWork()
        } else {
          if (callback.lastJob) {
            //延时检查
            setTimeout(flush, deadline - getCurrentTimePerformance())
            break
          }
          if (getCurrentTimePerformance() < deadline) {
            logWorkCost(callback)
            callback = askNextWork()
          } else {
            //需要中止,进入宏任务.原列表未处理完
            messageChannelCallback(flush)
            break
          }
        }
      }
      if (!callback) {
        onWork = false
      }
    }

    //render期间必须执行完成
    function requestAnimationFrameCheck() {
      if (onWork) {
        let work = askNextWork()
        while (work) {
          logWorkCost(work)
          if (work.lastJob && !realTime.get()) {
            if (askNextWork()) {
              beginAsyncWork()
            } else {
              onWork = false
            }
            break
          }
          work = askNextWork()
        }
      }
    }

    function beginAsyncWork() {
      messageChannelCallback(flush)
      limitFlush?.(requestAnimationFrameCheck)
    }
    return function () {
      if (!onWork) {
        onWork = true
        if (realTime.get()) {
          runTaskSync(flush)
        } else {
          beginAsyncWork()
        }
      }
    }
  }
}