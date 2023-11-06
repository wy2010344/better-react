import { React, domOf } from "better-react-dom"
import { renderRowTable } from "./rowTable"
import { defaultBoxShadow, renderKColumns } from "./util"
import { CSSProperties, stringifyStyle } from "better-react-dom-helper"

const cellStyle: CSSProperties = {
  // display: "table-cell",
  display: "inline-flex",
  width: '100px'
}
/**
 * 有一点,左侧sticky会在一定时候失效,是因为sticky的元素太多?
 * 但如果用display:table-cell与display:table-row,可以将多组cell固定sticky,但sticky容器内部的元素table化失效
 * 那就只有sticky内部的面板,自成各自的table,也就成了3列布局,列内自动的行布局
 * 但根层加上display:table,就正常了
 */
export function renderRowTableDemo() {

  domOf("div", {
    style: stringifyStyle({
      width: '100%',
      height: '100%',
      overflow: "auto",
    })
  }).render(function () {
    renderRowTable({
      dataSize: 100,
      getKey(i) {
        return i
      },
      style: {
        //!!这一句非常重要!如果没有,sticky就会失效
        display: "table"
        // display: "flex"
      },
      rowStyle: {
        // display: "table-row",
        whiteSpace: "nowrap"
        // display: 'flex'
      },
      left: {
        style: {
          display: "inline-flex",
          boxShadow: defaultBoxShadow
        },
        columns: renderKColumns(2, cellStyle)
      },
      columns: renderKColumns(30, cellStyle),
      right: {
        style: {
          display: "inline-flex",
          boxShadow: defaultBoxShadow
        },
        columns: renderKColumns(2, cellStyle)
      }
    })
  })
}