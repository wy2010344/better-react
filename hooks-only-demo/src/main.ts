import { render } from "core";
import { FiberNode } from "dom/updateDom";


const node = FiberNode.create(document.getElementById("app")!)
const destroy = render(<App />,
  node,
  //askTimeWork,
  //askIdleTimeWork,
  ScheduleAskTime
);