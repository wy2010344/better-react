import { EmptyFun } from "better-react";
import { React, domOf } from "better-react-dom";
import { renderArray, renderMax } from "better-react-helper";
import { defaultBoxShadow } from "./util";


type TableColumn = {
  key: any
  renderHeader(column: number): void
  renderCell(row: number, column: number): void
  renderFooter(column: number): void
}
function getTableColumnKey(a: TableColumn) {
  return a.key
}
/**
 * 只能sticky顶与底,左右可能只能固定首尾
 * @param param0 
 */
export function renderTable({
  columns,
  dataSize,
  getKey
}: {
  dataSize: number
  getKey(i: number): any
  columns: TableColumn[]
}) {
  domOf("table", {
    cellSpacing: 0,
    cellPadding: 0
  }).render(function () {
    domOf("tr", {
      style: {
        position: "sticky",
        top: 0,
        zIndex: 2
      }
    }).render(function () {
      renderArray(columns, getTableColumnKey, function (column, c) {
        column.renderHeader(c)
      })
    })
    renderMax(dataSize, getKey, function (row) {
      domOf("tr").render(function () {
        renderArray(columns, getTableColumnKey, function (column, c) {
          column.renderCell(row, c)
        })
      })
    })
    domOf("tr", {
      style: {
        position: "sticky",
        bottom: 0,
        zIndex: 2
      }
    }).render(function () {
      renderArray(columns, getTableColumnKey, function (column, c) {
        column.renderFooter(c)
      })
    })
  })
}


export function renderDisplayTable({
  style,
  rowStyle,
  columns,
  dataSize,
  getKey
}: {
  style?: React.CSSProperties
  rowStyle?: React.CSSProperties
  dataSize: number
  getKey(i: number): any
  columns: TableColumn[]
}) {
  domOf("div", {
    style
  }).render(function () {
    domOf("div", {
      style: {
        ...rowStyle,
        boxShadow: defaultBoxShadow,
        position: "sticky",
        top: 0,
        zIndex: 2
      }
    }).render(function () {
      renderArray(columns, getTableColumnKey, function (column, c) {
        column.renderHeader(c)
      })
    })
    renderMax(dataSize, getKey, function (row) {
      domOf("div", { style: rowStyle }).render(function () {
        renderArray(columns, getTableColumnKey, function (column, c) {
          column.renderCell(row, c)
        })
      })
    })
    domOf("div", {
      style: {
        ...rowStyle,
        boxShadow: defaultBoxShadow,
        position: "sticky",
        bottom: 0,
        zIndex: 2
      }
    }).render(function () {
      renderArray(columns, getTableColumnKey, function (column, c) {
        column.renderFooter(c)
      })
    })
  })
}