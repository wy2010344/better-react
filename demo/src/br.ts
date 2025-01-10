import { createRoot, dom, renderDom } from "better-react-dom";
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
import reorderList from "./demo/reorder/css";
import dslKanren from "./dsl-kanren";
import newMode from "./newMode";
import canvasRender from "./newMode/canvasRender";
import centerPicker from "./demo/centerPicker/reducer";
import todoList from "./todoList/index_new";
import newTokenize from "./newTokenize";
import demo from "./demo";
import useLayoutEffect from "./useLayoutEffect";
import mySpringAnimation from "./bezier-preview/mySpringAnimation";
import mySpring1 from "./bezier-preview/mySpring1";
import pipline from "./pipline";
import force3d from "./d3-learn/force/link";
import figmaClone from "./figmaClone";
import xmlToBetter from "./xmlToBetter";
import { renderTodoList } from "./开发AnimatePereference/renderTodoList";
import reanimated from "./reanimated";
import tsxSupport from "./tsxSupport";
import pinning from "./motion-one/scroll/pinning";
import fade from "./motion-one/scroll/fade";
import parallax from "./motion-one/scroll/parallax";
import video from "./motion-one/scroll/video";
import elementScroll from "./motion-one/scroll/elementScroll";
import renderOps from "./renderOps";
import { useRenderCode } from "better-react-dom-helper";
import { contentEditableText, initContentEditableModel } from "wy-dom-helper/contentEditable";
export function createBr(app: HTMLElement) {

  const destroy = createRoot(
    app,
    // newTokenize,
    // dslKanren,
    // renderPages,
    // demo,
    // useLayoutEffect,
    // renderFilter,
    // cssLayout,
    // figmaClone,
    // pinning,
    // fade,
    // parallax,
    // video,
    // elementScroll,
    // tsxSupport,
    // renderA1,
    demo,
    // renderOps,
    //这个是svg转化
    // xmlToBetter,
    // force3d,
    // reorderList,
    // canvasRender,
    // insideAnimation,
    // indexDB,
    // iScroll,
    // newMode,
    // centerPicker,
    // todoList,
    // renderTodoList,
    // bezierPreview,
    // mySpringAnimation,
    // pipline,
    // mySpring1,
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


function renderA1() {
  renderCode1("a1")
  renderCode1("b1")
}
function renderCode1(key: string) {
  const { value, renderContentEditable } = useRenderCode(key, init => initContentEditableModel(localStorage.getItem(init) || ''))

  renderContentEditable({
    render(value, a) {
      return renderDom("div", {
        a_contentEditable: contentEditableText,
        ...a,
        onFocus() {
          console.log("focus", value)
        },
        children() {
          renderDom("span", {
            childrenType: "text",
            children: value
          })
        }
      })
    },
  })
}
// function demo() {


//   dom.div({
//     style: `
//           background:blue;
//           `
//   }).render(function () {
//     dom.div({
//       style: `
//           background:green;
//           `
//     }).render(function () {
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
//   }).render(function () {
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