import { normalPanel } from "../panel/PanelContext";
import { renderPages } from "./renderPages";
import { renderTodoList } from "./renderTodoList";

export default normalPanel(function () {
  renderPages()
  // renderTodoList()
})
