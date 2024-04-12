import { createRoot, dom } from "better-react-dom";
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
import centerPicker from "./insideAnimation/centerPicker/centerPicker";
import todoList from "./todoList/index_new";
export function createBr(app: HTMLElement) {

  const destroy = createRoot(
    app,
    // dslKanren,
    // renderPages,
    // demo,
    // renderFilter,
    // cssLayout,
    // demo,
    // reorderList,
    // canvasRender,
    // insideAnimation,
    // indexDB,
    // iScroll,
    // newMode,
    // centerPicker,
    todoList,
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




function demo() {


  dom.div({
    style: `
          background:blue;
          `
  }).renderFragment(function () {
    dom.div({
      style: `
          background:green;
          `
    }).renderFragment(function () {
      dom.div({
        style: `
          background:yellow;
          `
      }).render()
      dom.div({
        style: `
          background:yellow;
          `
      }).render()
    })
    dom.div({
      style: `
          background:yellow;
          `
    }).render()
  })
  dom.div({
    style: `
          background:blue;
          `
  }).renderFragment(function () {
    dom.div({
      style: `
          background:yellow;
          `
    }).render()
  })
  dom.div({
    style: `
          background:yellow;
          `
  }).render()
}