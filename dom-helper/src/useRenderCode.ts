import { emptyArray } from "wy-helper"
import { ContentEditableModel, contentDelete, contentEnter, contentTab, getCurrentRecord, mb } from "wy-dom-helper/contentEditable"
import { useImperativeHandle, useRef } from "better-react-helper"
import { useContentEditable } from "./useContentEditable"
import { React } from "wy-dom-helper"

export function useRenderCode<F extends HTMLElement, T>(
  init: T,
  initFun: (v: T) => ContentEditableModel,
) {
  const { value, current, renderContentEditable, dispatch } = useContentEditable(init, initFun)
  const editorRef = useRef<F | undefined>(undefined)
  return {
    value,
    current,
    dispatch,
    editorRef,
    renderContentEditable({
      noFocus,
      render
    }: {
      noFocus?: boolean
      render(value: string, a: {
        onInput(e: React.FormEvent): void
        onCompositionEnd(): void
        onKeyDown(e: React.KeyboardEvent<F>): void
      }): F
    }) {
      renderContentEditable({
        noFocus,
        render(value) {
          const div = render(value, {
            onInput(event: React.FormEvent) {
              if (event.isComposing) {
                return
              }
              dispatch({
                type: "input",
                record: getCurrentRecord(div)
              })
            },
            onCompositionEnd() {
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
          })
          useImperativeHandle(editorRef, () => div, emptyArray)
          return div
        },
      })
      return editorRef
    }
  }
}
function isCtrl(e: React.KeyboardEvent) {
  return e.metaKey || e.ctrlKey
}
