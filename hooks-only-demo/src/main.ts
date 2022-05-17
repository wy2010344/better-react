import { render } from "./core";
import { FiberNode } from "./dom/updateDom";
import { ScheduleAskTime } from "./dom/schedule";
import { useDom } from "./dom";


const node = FiberNode.create(document.getElementById("app")!)
const destroy = render(
  function () {
    useDom("div", {
      style: {
        width: "100px",
        height: "100px",
        backgroundColor: "green"
      }
    })
  },
  node,
  //askTimeWork,
  //askIdleTimeWork,
  ScheduleAskTime
);