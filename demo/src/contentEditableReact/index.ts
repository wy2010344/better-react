import { useMemo } from "better-react-helper";
import { normalPanel } from "../panel/PanelContext";
import { mb } from "better-react-dom-helper";
import { React, domOf } from "better-react-dom";
import { useEffect } from "better-react";
import { ContentEditableModel, contentDelete, contentEnter, contentTab, getCurrentRecord, initContentEditableModel, useContentEditable } from "./useContentEditable";


const storeKey = 'test-content-editable'
function initFun(content: string): ContentEditableModel {
  const initValue = localStorage.getItem(storeKey)
  if (initValue) {
    try {
      return JSON.parse(initValue)
    } catch (err) { }
  }
  return initContentEditableModel(content)
}
/**
 * 失败的尝试,使用contentEditable浏览器兼容性麻烦.∂
 * 使用textarea会遮挡事件.
 */
export default normalPanel(function (operate) {
  const { value, dispatch, current, renderContentEditable } = useContentEditable('', initFun)
  useEffect(() => {
    localStorage.setItem(storeKey, JSON.stringify(value))
  }, [value])
  renderContentEditable(function () {
    const div = domOf("div", {

      style: `
      min-height: 100px;
      background-color: gray;
      white-space: pre;
    `,
      onInput(event: any) {
        if (event.isComposing) {
          return
        }
        dispatch({
          type: "input",
          record: getCurrentRecord(div)
        })
      },
      onCompositionEnd(event) {
        dispatch({
          type: "input",
          record: getCurrentRecord(div)
        })
      },
      onKeyDown(e) {
        if (mb.DOM.keyCode.TAB(e)) {
          e.preventDefault()
          const record = contentTab(div, e.shiftKey)
          if (record) {
            dispatch({
              type: "input",
              record
            })
          }
        } else if (mb.DOM.keyCode.ENTER(e)) {
          e.preventDefault()
          const record = contentEnter(div)
          dispatch({
            type: "input",
            record
          })
        } else if (mb.DOM.keyCode.Z(e)) {
          if (isCtrl(e)) {
            if (e.shiftKey) {
              //redo
              e.preventDefault()
              dispatch({
                type: "redo"
              })
            } else {
              //undo
              e.preventDefault()
              dispatch({
                type: "undo"
              })
            }
          }
        } else if (mb.DOM.keyCode.BACKSPACE(e)) {
          e.preventDefault()
          const record = contentDelete(div)
          if (record) {
            dispatch({
              type: "input",
              record
            })
          }
        }
      }
    }).render(function () {
      const list = useMemo(() => {
        return current.value.split('')
      }, [current.value])
      list.forEach(row => {
        domOf("span").renderInnerHTML(row)
      })
    })
    return div
  })

  domOf("div").renderTextContent('原生')
  domOf("div", {
    style: `
      min-height: 100px;
      background-color: gray;
      white-space: pre;
    `
  }).renderContentEditable(true)//'plaintext-only')
})

function isCtrl(e: React.KeyboardEvent) {
  return e.metaKey || e.ctrlKey
}