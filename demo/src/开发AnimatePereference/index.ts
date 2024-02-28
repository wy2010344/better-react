import { normalPanel } from "../panel/PanelContext";
import { renderPages } from "./renderPages";
import { renderTodoList } from "./renderTodoList";
import { renderPagesValue } from "./renderPages-value";
import { renderSinglePage } from "./singlePage";
import { renderTransformZ } from "./transformZ";
import 内置退出动画 from "./内置退出动画";
import { render内置入场动画 } from "./内置入场动画";
import { render动画测试 } from "./动画测试";
import { renderFilter } from "./renderFilter";

export default normalPanel(function () {
  // renderPages()
  // renderPagesValue()
  renderFilter()
  // renderSinglePage()
  // renderTransformZ()
  // 内置退出动画()
  // render内置入场动画()
  // render动画测试()
})
