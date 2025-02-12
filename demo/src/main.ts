
import { createRoot, dom } from "better-react-dom";
import { getScheduleAskTime } from "wy-helper";
import { useChange } from 'better-react-helper'
import countDemo from "./count-demo";
import complesTodoDemo from "./complex-todo-demo";
import todoDemo from "./todo-demo";
const app = document.getElementById("app")!
const destroy = createRoot(app, () => {
  // countDemo()
  todoDemo()
}, getScheduleAskTime())
window.addEventListener("unload", destroy)