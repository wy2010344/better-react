import { emptyArray, useEffect, useGetFlushSync } from "better-react"
import { renderOne, useMemo, useReducer } from "better-react-helper"
import { MbRange, contentEditable, mb } from "./mb"

type ModelRecord = {
  //选择区域是跟随的,但事实上也可能独立
  range: MbRange
  value: string
}
export type ContentEditableModel = {
  currentIndex: number
  history: ModelRecord[]
}

type Action = {
  type: "input"
  record: ModelRecord
} | {
  type: "undo"
} | {
  type: "redo"
}


/**
 * 减少历史数量,如果只是追加,也许不用那么频繁
 * @param model 
 * @param record 
 * @returns 
 */
function appendRecord(model: ContentEditableModel, record: ModelRecord): ContentEditableModel {
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
function reducer(model: ContentEditableModel, action: Action): ContentEditableModel {
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
  }
  return model
}

export function useContentEditable<T>(t: T, initFun: (t: T) => ContentEditableModel) {
  const [value, _dispatch] = useReducer(reducer, t, initFun)
  const flushSync = useGetFlushSync()
  const dispatch: typeof _dispatch = function (...args) {
    flushSync(() => {
      _dispatch(...args)
    })
  }
  const current = useMemo(() => {
    return value.history[value.currentIndex]
  }, [value.history, value.currentIndex])
  return {
    current,
    value,
    dispatch,
    renderContentEditable(renderContent: () => HTMLElement) {
      renderOne(current.value, function () {
        const div = renderContent()
        useEffect(() => {
          div.contentEditable = contentEditable.text + ''
        }, emptyArray)
        useEffect(() => {
          mb.DOM.setSelectionRange(div, { ...current.range })
        }, [current.range])
      })
    }
  }
}


export function initContentEditableModel(content: string): ContentEditableModel {
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



export function getCurrentRecord(editor: HTMLElement): ModelRecord {
  const value = editor.textContent || ''
  const range = mb.DOM.getSelectionRange(editor)
  return {
    value,
    range
  }
}

export function contentEnter(editor: HTMLElement): ModelRecord {
  const { value, range } = getCurrentRecord(editor)
  const [min, max] = [range.start, range.end].sort(sortNum)
  const beforeText = value.slice(0, min)
  //如果没有后继,强行加一个换行,看原生也是这么处理的
  const afterText = value.slice(max, value.length) || '\n'
  let idx = beforeText.length + 1
  return {
    value: beforeText + '\n' + afterText,
    range: {
      start: idx,
      end: idx,
      dir: range.dir
    }
  }
}

export function contentDelete(editor: HTMLElement): ModelRecord | void {
  const { value, range } = getCurrentRecord(editor)
  const [min, max] = [range.start, range.end].sort(sortNum)
  const beforeText = value.slice(0, min)
  //如果没有后继,强行加一个换行,看原生也是这么处理的
  const afterText = value.slice(max, value.length)
  if (min != max) {
    //删除选中区域
    return {
      value: beforeText + afterText,
      range: {
        start: min,
        end: min
      }
    }
  } else {
    //向前退一步
    if (min != 0) {
      const idx = range.start - 1
      return {
        value: beforeText.slice(0, beforeText.length - 1) + afterText,
        range: {
          ...range,
          start: idx,
          end: idx
        }
      }
    }
  }
}
export function contentTab(
  editor: HTMLElement,
  shiftKey: boolean,
  tab = "\t",
): ModelRecord | void {
  const { value, range } = getCurrentRecord(editor)
  //这里实时range,应该更新历史记录中的range,即如果之前是选中的tab,撤销时会恢复成选中状态.
  const [min, max] = [range.start, range.end].sort(sortNum)
  if (range.start != range.end) {
    //多行
    if (shiftKey) {
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
      return {
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
      }
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
      return {
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
      }
    }
  } else {
    const beforeText = value.slice(0, min)
    const afterText = value.slice(max, value.length)
    //单行
    if (shiftKey) {
      if (beforeText.endsWith(tab)) {
        const newIndex = beforeText.length - tab.length
        return {
          value: beforeText.slice(0, beforeText.length - tab.length) + afterText,
          range: {
            start: newIndex,
            end: newIndex
          }
        }
      }
    } else {
      const newIndex = beforeText.length + tab.length
      return {
        value: beforeText + tab + afterText,
        range: {
          start: newIndex,
          end: newIndex
        }
      }
    }
  }
}
