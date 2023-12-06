import { normalPanel } from "../panel/PanelContext";
import { renderPages } from "./renderPages";
import { renderTodoList } from "./renderTodoList";
import { renderSinglePage } from "./singlePage";
import { renderTransformZ } from "./transformZ";
import 内置退出动画 from "./内置退出动画";

export default normalPanel(function () {
  renderPages()
  // renderTodoList()
  // renderSinglePage()
  // renderTransformZ()
  // 内置退出动画()
})
