import { createRoot } from "better-react-dom";
import insideAnimation from "./insideAnimation/frameLayout";
// import iScroll from "./iScroll/index";
import iScroll from "./iScroll/myScrollFrame";
// import { requestAnimationFrameScheduler } from "better-react-dom";
import ExpensiveViewSingle from "./ExpensiveViewSingle";
import { AskNextTimeWork, EmptyFun, NextTimeWork, createRunSyncTasks, emptyArray, emptyObject, getCurrentTimePerformance, getScheduleAskTime, messageChannelCallback } from "wy-helper";
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
import centerPicker from "./insideAnimation/centerPicker/frame";
export function createBr(app: HTMLElement) {

  const destroy = createRoot(
    app,
    // dslKanren,
    // renderPages,
    // demo,
    // renderFilter,
    // cssLayout,
    // reorderList,
    // canvasRender,
    // insideAnimation,
    // indexDB,
    // iScroll,
    // newMode,
    centerPicker,
    // bezierPreview,
    // ExpensiveViewSingle,
    // reanimated,
    // demo1,
    //askTimeWork,
    //askIdleTimeWork,
    // askTimeWork,
    // requestAnimationFrameScheduler
    getScheduleAskTime({
      // limitFlush: requestAnimationFrame
    })
  );
}


