import { emptyArray } from "better-react"
import { React, domOf } from "better-react-dom"
import { renderArray, renderMax } from "better-react-helper"
import { KColumn, getKColumnKey } from "./util"


export function renderColumnTable({
  dataSize,
  getKey,
  left,
  columns,
  right
}: {
  dataSize: number,
  getKey(i: number): any
  left?: {
    style?: React.CSSProperties
    columns: KColumn[]
  }
  columns: KColumn[]
  right?: {
    style?: React.CSSProperties
    columns: KColumn[]
  }
}) {
  domOf("div", {
    style: {
      position: "relative",
      whiteSpace: "nowrap",
      width: '100%',
      height: '100%',
      overflow: "auto"
    }
  }).render(function () {
    //left
    domOf("div", {
      style: {
        ...left?.style,
        display: 'inline-block',
        zIndex: 1,
        left: 0,
        position: 'sticky',
        whiteSpace: 'nowrap'
      }
    }).render(function () {
      renderArray(left?.columns || emptyArray as KColumn[], getKColumnKey, function (column, i) {
        domOf("div", {
          style: {
            display: 'inline-block'
          }
        }).render(function () {
          column.renderHeader("left", i)
          renderMax(dataSize, getKey, function (row) {
            column.renderCell("left", i, row)
          })
          column.renderFooter("left", i)
        })
      })
    })
    //center
    renderArray(columns, getKColumnKey, function (column, i) {
      domOf("div", {
        style: {
          display: 'inline-block'
        }
      }).render(function () {
        column.renderHeader("center", i)
        renderMax(dataSize, getKey, function (row) {
          column.renderCell("center", i, row)
        })
        column.renderFooter("center", i)
      })
    })
    //right
    domOf("div", {
      style: {
        ...right?.style,
        display: 'inline-block',
        zIndex: 1,
        right: 0,
        position: 'sticky',
        whiteSpace: 'nowrap'
      }
    }).render(function () {
      renderArray(right?.columns || emptyArray as KColumn[], getKColumnKey, function (column, i) {
        domOf("div", {
          style: {
            display: 'inline-block',
          }
        }).render(function () {
          column.renderHeader("right", i)
          renderMax(dataSize, getKey, function (row) {
            column.renderCell("right", i, row)
          })
          column.renderFooter("right", i)
        })
      })
    })
  })
}