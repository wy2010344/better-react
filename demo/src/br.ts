import { createRoot } from "better-react-dom";
import insideAnimation from "./insideAnimation";
import iScroll from "./iScroll/myScrollFrame";
// import { requestAnimationFrameScheduler } from "better-react-dom";
import { AskNextTimeWork } from "better-react";
import ExpensiveViewSingle from "./ExpensiveViewSingle";
import { EmptyFun } from "wy-helper";
import { getScheduleAskTime, requestAnimationFrameScheduler } from "./schedule";
import indexDB from "./indexDB";
export function createBr(app: HTMLElement) {

  const destroy = createRoot(
    app,
    insideAnimation,
    // indexDB,
    // iScroll,
    // ExpensiveViewSingle,
    // reanimated,
    // demo1,
    //askTimeWork,
    //askIdleTimeWork,
    // askTimeWork,
    // requestAnimationFrameScheduler
    getScheduleAskTime({})
  );
}

