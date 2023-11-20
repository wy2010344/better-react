import { normalPanel } from "../panel/PanelContext";
import { renderPages } from "./renderPages";
import { renderTodoList } from "./renderTodoList";
import { renderSinglePage } from "./singlePage";
import { renderTransformZ } from "./transformZ";

export default normalPanel(function () {
  // renderPages()
  // renderTodoList()
  // renderSinglePage()
  renderTransformZ()
})
