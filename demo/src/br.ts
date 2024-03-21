import { createRoot, dom } from "better-react-dom";
import insideAnimation from "./insideAnimation/frameLayout";
import iScroll from "./iScroll/index";
// import { requestAnimationFrameScheduler } from "better-react-dom";
import ExpensiveViewSingle from "./ExpensiveViewSingle";
import { EmptyFun, emptyArray, getScheduleAskTime } from "wy-helper";
import indexDB from "./indexDB";
import cssLayout from "./insideAnimation/cssLayout";
import demo1 from "./better-scroll/demo1";
import { renderPages } from "./开发AnimatePereference/renderPages";
import { renderFilter } from "./开发AnimatePereference/renderFilter";
import { useVersion } from "better-react-helper";
import bezierPreview from "./bezier-preview";
import reorderList from "./insideAnimation/reorderList";
export function createBr(app: HTMLElement) {

  const destroy = createRoot(
    app,
    // renderPages,
    // demo,
    // renderFilter,
    // cssLayout,
    reorderList,
    // insideAnimation,
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
    getScheduleAskTime({
      limitFlush: requestAnimationFrame
    })
  );
}

