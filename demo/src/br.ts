import { createRoot, dom } from "better-react-dom";
import insideAnimation from "./insideAnimation/frameLayout";
// import iScroll from "./iScroll/index";
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
import reorderList from "./demo/reorder/frame";
import dslKanren from "./dsl-kanren";
import newMode from "./newMode";
import canvasRender from "./newMode/canvasRender";
import centerPicker from "./demo/centerPicker/reducer";
import todoList from "./todoList/index_new";
import newTokenize from "./newTokenize";
import demo from "./demo";
import useLayoutEffect from "./useLayoutEffect";
export function createBr(app: HTMLElement) {

  const destroy = createRoot(
    app,
    // newTokenize,
    // dslKanren,
    // renderPages,
    demo,
    // useLayoutEffect,
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
    // todoList,
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




// function demo() {


//   dom.div({
//     style: `
//           background:blue;
//           `
//   }).renderFragment(function () {
//     dom.div({
//       style: `
//           background:green;
//           `
//     }).renderFragment(function () {
//       dom.div({
//         style: `
//           background:yellow;
//           `
//       }).render()
//       dom.div({
//         style: `
//           background:yellow;
//           `
//       }).render()
//     })
//     dom.div({
//       style: `
//           background:yellow;
//           `
//     }).render()
//   })
//   dom.div({
//     style: `
//           background:blue;
//           `
//   }).renderFragment(function () {
//     dom.div({
//       style: `
//           background:yellow;
//           `
//     }).render()
//   })
//   dom.div({
//     style: `
//           background:yellow;
//           `
//   }).render()
// }