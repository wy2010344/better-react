import { createRoot, dom } from "better-react-dom";
import insideAnimation from "./insideAnimation/frameLayout";
import iScroll from "./iScroll/index";
// import { requestAnimationFrameScheduler } from "better-react-dom";
import { AskNextTimeWork, createContext } from "better-react";
import ExpensiveViewSingle from "./ExpensiveViewSingle";
import { EmptyFun, emptyArray } from "wy-helper";
import { getScheduleAskTime, requestAnimationFrameScheduler } from "./schedule";
import indexDB from "./indexDB";
import cssLayout from "./insideAnimation/cssLayout";
import demo1 from "./better-scroll/demo1";
import { renderPages } from "./开发AnimatePereference/renderPages";
import { renderFilter } from "./开发AnimatePereference/renderFilter";
import { useVersion } from "better-react-helper";
import bezierPreview from "./bezier-preview";
export function createBr(app: HTMLElement) {

  const destroy = createRoot(
    app,
    // renderPages,
    // demo,
    // renderFilter,
    // cssLayout,
    insideAnimation,
    // indexDB,
    // iScroll,
    // bezierPreview,
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

