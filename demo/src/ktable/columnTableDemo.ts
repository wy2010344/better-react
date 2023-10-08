import { renderColumnTable } from "./columnTable"
import { defaultBoxShadow, renderKColumns } from "./util"

export function renderColumnTableDemo() {
  renderColumnTable({
    dataSize: 100,
    getKey(i) {
      return i
    },
    left: {
      style: {
        boxShadow: defaultBoxShadow
      },
      columns: renderKColumns(2)
    },
    columns: renderKColumns(30),
    right: {
      style: {
        boxShadow: defaultBoxShadow
      },
      columns: renderKColumns(2)
    }
  })
}




