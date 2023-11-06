import { React, domOf } from "better-react-dom";
import { KColumn, getKColumnKey } from "./util";
import { renderArray, renderMax } from "better-react-helper";
import { emptyArray } from "better-react";
import { CSSProperties, stringifyStyle } from "better-react-dom-helper";

/**
 * 
 * 如果用display:inline-block,inline-flex,会出现滚动到一定时候,sticky失效的情况
 * 但如果用display:table-cell与display:table-row,可以将多组cell固定sticky
 * @param param0 
 */
export function renderRowTable({
  style,
  dataSize,
  getKey,
  rowStyle,
  left,
  columns,
  right
}: {
  style?: CSSProperties,
  dataSize: number,
  getKey(i: number): any
  rowStyle?: CSSProperties
  left?: {
    style?: CSSProperties
    columns: KColumn[]
  }
  columns: KColumn[]
  right?: {
    style?: CSSProperties
    columns: KColumn[]
  }
}) {
  domOf("div", {
    style: stringifyStyle(style)
  }).render(function () {
    //顶部
    domOf("div", {
      style: stringifyStyle({
        ...rowStyle,
        position: "sticky",
        top: 0,
        zIndex: 2
      })
    }).render(function () {
      //左边
      domOf("div", {
        style: stringifyStyle({
          ...left?.style,
          position: "sticky",
          left: 0,
          zIndex: 1
        })
      }).render(function () {
        renderArray(left?.columns || emptyArray, getKColumnKey, function (column, i) {
          //中间
          column.renderHeader("left", i)
        })
      })
      renderArray(columns, getKColumnKey, function (column, i) {
        //中间
        column.renderHeader("center", i)
      })
      //右边
      domOf("div", {
        style: stringifyStyle({
          ...right?.style,
          position: "sticky",
          right: 0,
          zIndex: 1
        })
      }).render(function () {
        renderArray(right?.columns || emptyArray, getKColumnKey, function (column, i) {
          //中间
          column.renderHeader("right", i)
        })
      })
    })


    renderMax(dataSize, getKey, function (i) {
      domOf("div", {
        style: stringifyStyle(rowStyle),
      }).render(function () {
        //左边
        domOf("div", {
          style: stringifyStyle({
            ...left?.style,
            position: "sticky",
            left: 0,
            zIndex: 1
          })
        }).render(function () {
          renderArray(left?.columns || emptyArray, getKColumnKey, function (column, c) {
            //中间
            column.renderCell("left", c, i)
          })
        })
        renderArray(columns, getKColumnKey, function (column, c) {
          //中间
          column.renderCell("center", c, i)
        })
        //右边
        domOf("div", {
          style: stringifyStyle({
            ...right?.style,
            position: "sticky",
            right: 0,
            zIndex: 1
          })
        }).render(function () {
          renderArray(right?.columns || emptyArray, getKColumnKey, function (column, c) {
            //中间
            column.renderCell("right", c, i)
          })
        })
      })
    })

    //底部
    domOf("div", {
      style: stringifyStyle({
        ...rowStyle,
        position: "sticky",
        bottom: 0,
        zIndex: 1
      })
    }).render(function () {
      //左边
      domOf("div", {
        style: stringifyStyle({
          ...left?.style,
          position: "sticky",
          left: 0,
          zIndex: 1
        })
      }).render(function () {
        renderArray(left?.columns || emptyArray, getKColumnKey, function (column, i) {
          //中间
          column.renderFooter("left", i)
        })
      })
      renderArray(columns, getKColumnKey, function (column, i) {
        //中间
        column.renderFooter("center", i)
      })
      //右边
      domOf("div", {
        style: stringifyStyle({
          ...right?.style,
          position: "sticky",
          right: 0,
          zIndex: 1
        })
      }).render(function () {
        renderArray(right?.columns || emptyArray, getKColumnKey, function (column, i) {
          //中间
          column.renderFooter("right", i)
        })
      })
    })
  })
}