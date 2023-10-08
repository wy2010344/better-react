import { panelWith } from "../panel/PanelContext";
import { renderColumnTableDemo } from "./columnTableDemo";
import { renderDisplayTableDemo } from "./renderTableDemo";
import { renderRowTableDemo } from "./rowTableDemo";


const list = Array(100).fill(1).map((_, i) => i)

function range(i: number) {
  return Array(i).fill(1).map((_, i) => i)
}


export default panelWith({
  initWidth: 800,
  children(operate, id) {
    // renderColumnTableDemo()
    renderRowTableDemo()
    // renderTableDemo()
    // renderDisplayTableDemo()
  },
})


