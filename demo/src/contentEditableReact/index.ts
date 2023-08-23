import { renderOne, useChange, useMemo, useReducer } from "better-react-helper";
import { normalPanel } from "../panel/PanelContext";
import { MbRange, afterCursor, beforeCursor, contentEditable, findBeforePadding, mb } from "better-react-dom-helper";
import { React, domExistOf, domOf } from "better-react-dom";
import { emptyArray, useBaseReducer, useBeforeAttrEffect, useEffect, useGetFlushSync } from "better-react";

type ModelRecord = {
  //选择区域是跟随的,但事实上也可能独立
  range: MbRange
  value: string
}
type Model = {
  currentIndex: number
  history: ModelRecord[]
}

type Action = {
  type: "input"
  element: HTMLElement
} | {
  type: "undo"
} | {
  type: "redo"
} | {
  type: "tab",
  element: HTMLElement
  shiftKey?: boolean
} | {
  type: "enter"
  element: HTMLElement
} | {
  type: "delete"
  element: HTMLElement
}
/**
 * 减少历史数量,如果只是追加,也许不用那么频繁
 * @param model 
 * @param record 
 * @returns 
 */
function appendRecord(model: Model, record: ModelRecord): Model {
  const cdx = model.currentIndex
  const history = model.history.slice(0, cdx + 1)
  //第一条不处理
  const last = history.length > 2 ? history.at(-1) : undefined
  if (last && last.range.start == last.range.end) {
    const beforeIdx = last.range.start
    if (record.range.start == record.range.end) {
      const thisIdx = record.range.start
      const diff = thisIdx - beforeIdx
      if (0 <= diff) {
        if (record.value.startsWith(last.value) && record.value.length - last.value.length == diff) {
          //当前对之前是纯包含关系,直接替换
          history.pop()
          history.push(record)
          return {
            currentIndex: cdx,
            history
          }
        }
      }
    }
  }
  history.push(record)
  if (history.length > 100) {
    history.shift()
    return {
      currentIndex: cdx,
      history
    }
  }
  return {
    currentIndex: cdx + 1,
    history
  }
}
function sortNum(a: number, b: number) {
  return a - b
}
function recordInModel(model: Model, editor: HTMLElement) {
  const value = editor.textContent || ''
  return appendRecord(model, {
    value,
    range: mb.DOM.getSelectionRange(editor)
  })
}
function getCurrentData(model: Model) {
  return model.history[model.currentIndex]
}
function reducer(model: Model, action: Action): Model {
  if (action.type == "input") {
    return recordInModel(model, action.element)
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
  } else if (action.type == "enter") {
    model = recordInModel(model, action.element)
    const { range, value } = getCurrentData(model)
    const [min, max] = [range.start, range.end].sort(sortNum)
    const beforeText = value.slice(0, min)
    //如果没有后继,强行加一个换行,看原生也是这么处理的
    const afterText = value.slice(max, value.length) || '\n'
    let idx = beforeText.length + 1
    return appendRecord(model, {
      value: beforeText + '\n' + afterText,
      range: {
        start: idx,
        end: idx,
        dir: range.dir
      }
    })
  } else if (action.type == "tab") {
    const tab = '\t'
    model = recordInModel(model, action.element)
    const { value, range } = getCurrentData(model)
    //这里实时range,应该更新历史记录中的range,即如果之前是选中的tab,撤销时会恢复成选中状态.
    const [min, max] = [range.start, range.end].sort(sortNum)
    if (range.start != range.end) {
      //多行
      if (action.shiftKey) {
        const lines = value.split('\n')
        let beforeIdx = 0
        const newLines: string[] = []
        let canTab = false
        let removeLine = 0
        let removeFirst = 0
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          const nextIdx = beforeIdx + line.length + 1
          if (beforeIdx <= min && min < nextIdx) {
            canTab = true
            if (line.startsWith(tab) && beforeIdx + tab.length <= min) {
              removeFirst = tab.length
            }
          }
          if (canTab && line.startsWith(tab)) {
            removeLine++
            newLines.push(line.slice(tab.length, line.length))
          } else {
            newLines.push(line)
          }
          if (beforeIdx <= max && max < nextIdx) {
            canTab = false
          }
          beforeIdx = nextIdx
        }
        return appendRecord(model, {
          value: newLines.join('\n'),
          range: range.start > range.end ? {
            start: range.start - (removeLine * tab.length),
            end: range.end - removeFirst,
            dir: range.dir
          } : {
            start: range.start - removeFirst,
            end: range.end - (removeLine * tab.length),
            dir: range.dir
          }
        })
      } else {
        const lines = value.split('\n')
        let beforeIdx = 0
        const newLines: string[] = []
        let canTab = false
        let addLine = 0
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          const nextIdx = beforeIdx + line.length + 1
          if (beforeIdx <= min && min < nextIdx) {
            canTab = true
          }
          if (canTab) {
            addLine++
            newLines.push(tab + line)
          } else {
            newLines.push(line)
          }
          if (beforeIdx <= max && max < nextIdx) {
            canTab = false
          }
          beforeIdx = nextIdx
        }
        return appendRecord(model, {
          value: newLines.join('\n'),
          range: range.start > range.end ? {
            start: range.start + (addLine * tab.length),
            end: range.end + tab.length,
            dir: range.dir
          } : {
            start: range.start + tab.length,
            end: range.end + (addLine * tab.length),
            dir: range.dir
          }
        })
      }
    } else {
      const beforeText = value.slice(0, min)
      const afterText = value.slice(max, value.length)
      //单行
      if (action.shiftKey) {
        if (beforeText.endsWith(tab)) {
          const newIndex = beforeText.length - tab.length
          return appendRecord(model, {
            value: beforeText.slice(0, beforeText.length - tab.length) + afterText,
            range: {
              start: newIndex,
              end: newIndex
            }
          })
        }
      } else {
        const newIndex = beforeText.length + tab.length
        return appendRecord(model, {
          value: beforeText + tab + afterText,
          range: {
            start: newIndex,
            end: newIndex
          }
        })
      }
    }
  } else if (action.type == "delete") {
    model = recordInModel(model, action.element)
    const { value, range } = getCurrentData(model)
    const [min, max] = [range.start, range.end].sort(sortNum)
    const beforeText = value.slice(0, min)
    //如果没有后继,强行加一个换行,看原生也是这么处理的
    const afterText = value.slice(max, value.length)
    if (min != max) {
      //删除选中区域
      return appendRecord(model, {
        value: beforeText + afterText,
        range: {
          start: min,
          end: min
        }
      })
    } else {
      //向前退一步
      if (min == 0) {
        return model
      }
      const idx = range.start - 1
      return appendRecord(model, {
        value: beforeText.slice(0, beforeText.length - 1) + afterText,
        range: {
          ...range,
          start: idx,
          end: idx
        }
      })
    }
  }
  return model
}
function initFun(content: string): Model {
  const initValue = localStorage.getItem(storeKey)
  if (initValue) {
    try {
      return JSON.parse(initValue)
    } catch (err) { }
  }
  return {
    currentIndex: 0,
    history: [
      {
        range: {
          start: content.length,
          end: content.length
        },
        value: content,
      }
    ]
  }
}

const storeKey = 'test-content-editable'
/**
 * 失败的尝试,使用contentEditable浏览器兼容性麻烦.∂
 * 使用textarea会遮挡事件.
 */
export default normalPanel(function (operate) {
  const [value, _dispatch] = useReducer(reducer, '', initFun)
  useEffect(() => {
    localStorage.setItem(storeKey, JSON.stringify(value))
  }, [value])
  const flushSync = useGetFlushSync()
  const dispatch: typeof _dispatch = function (...args) {
    flushSync(() => {
      _dispatch(...args)
    })
  }
  const current = useMemo(() => {
    return value.history[value.currentIndex]
  }, [value.history, value.currentIndex])

  renderOne(current.value, function () {
    useEffect(() => {
      div.contentEditable = contentEditable.text + ''
    }, emptyArray)
    useEffect(() => {
      mb.DOM.setSelectionRange(div, { ...current.range })
    }, [current.range])
    const div = domOf("div", {
      style: {
        minHeight: '100px',
        backgroundColor: 'gray',
        whiteSpace: "pre"
      },
      onInput(event: any) {
        if (event.isComposing) {
          return
        }
        dispatch({
          type: "input",
          element: div
        })
      },
      onCompositionEnd(event) {
        dispatch({
          type: "input",
          element: div
        })
      },
      onKeyDown(e) {
        if (mb.DOM.keyCode.TAB(e)) {
          e.preventDefault()
          dispatch({
            type: "tab",
            element: div,
            shiftKey: e.shiftKey
          })
        } else if (mb.DOM.keyCode.ENTER(e)) {
          e.preventDefault()
          dispatch({
            type: "enter",
            element: div
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
          dispatch({
            type: "delete",
            element: div
          })
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
  })

  domOf("div").renderTextContent('原生')
  domOf("div", {
    style: {
      minHeight: '100px',
      backgroundColor: 'gray',
      whiteSpace: "pre"
    }
  }).renderContentEditable('plaintext-only')
})

function isCtrl(e: React.KeyboardEvent) {
  return e.metaKey || e.ctrlKey
}