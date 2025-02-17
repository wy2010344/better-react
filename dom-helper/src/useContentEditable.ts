import { flushSync } from "better-react"
import { useEffect, useMemo, useReducer, renderOne, useAttrEffect } from "better-react-helper"
import { ContentEditableModel, EditRecord, appendRecord, contentEditableText, fixScroll } from "wy-dom-helper/contentEditable"
import { emptyArray } from "wy-helper"



export type EditAction = {
  type: "input"
  record: EditRecord
} | {
  type: "undo"
} | {
  type: "redo"
} | {
  type: "reset"
  record: EditRecord
}

function reducer(model: ContentEditableModel, action: EditAction): ContentEditableModel {
  if (action.type == "input") {
    return appendRecord(model, action.record)
  } else if (action.type == "undo") {
    const cdx = model.currentIndex
    if (cdx) {
      return {
        currentIndex: cdx - 1,
        history: model.history
      }
    }
  } else if (action.type == "redo") {
    const ndx = model.currentIndex + 1
    if (ndx < model.history.length) {
      return {
        currentIndex: ndx,
        history: model.history
      }
    }
  } else if (action.type == "reset") {
    return {
      currentIndex: 0,
      history: [action.record],
    };
  }
  return model
}

export function useContentEditable<T>(t: T, initFun: (t: T) => ContentEditableModel) {
  const [value, _dispatch] = useReducer(reducer, t, initFun)
  const dispatch: typeof _dispatch = function (v) {
    flushSync(() => {
      _dispatch(v)
    })
  }
  const current = useMemo(() => {
    return value.history[value.currentIndex]
  }, [value.history, value.currentIndex])
  return {
    current,
    value,
    dispatch,
    renderContentEditable(args: {
      noFocus?: boolean
      render(value: string): HTMLElement
    }) {
      renderOne(current.value, function (value) {
        const div = args.render(value)
        useEffect(() => {
          if (args.noFocus) {
            return
          }
          fixScroll(div, current)
        }, emptyArray)
      })
    }
  }
} 