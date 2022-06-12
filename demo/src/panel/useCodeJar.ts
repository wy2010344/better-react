import { useEffect, useState } from "better-react"
import { useDom, DomElements, React } from "better-react-dom"
import { } from "better-react-dom"
import { useConstRefValue, useRefValue } from "better-react-helper"
import mb, { contentEditable, MbRange } from "./mb"

function shouldRecord(e: React.KeyboardEvent) {
  return !isUndo(e)
    && !isRedo(e)
    && !mb.DOM.keyCode.META(e)
    && !mb.DOM.keyCode.CONTROL(e)
    && !mb.DOM.keyCode.ALT(e)
    && !mb.DOM.keyCode.ARROWDOWN(e)
    && !mb.DOM.keyCode.ARROWLEFT(e)
    && !mb.DOM.keyCode.ARROWUP(e)
    && !mb.DOM.keyCode.ARROWDOWN(e)
}
/**
 * 光标前的内容
 * @param editor 
 */
function beforeCursor(editor: HTMLElement) {
  const s = window.getSelection()
  if (s) {
    const r0 = s.getRangeAt(0)
    const r = document.createRange()
    r.selectNodeContents(editor)
    r.setEnd(r0.startContainer, r0?.startOffset)
    return r.toString()
  } else {
    return ""
  }
}
/**
 * 光标后的内容
 * @param editor 
 */
function afterCursor(editor: HTMLElement) {
  const s = window.getSelection()
  if (s) {
    const r0 = s.getRangeAt(0)
    const r = document.createRange()
    r.selectNodeContents(editor)
    r.setStart(r0.endContainer, r0.endOffset)
    return r.toString()
  } else {
    return ""
  }
}

/**
 * 寻找字符串从某一点开始的空格或tab
 * @param text 
 * @param from 
 */
function findPadding(text: string, from = 0) {
  let j = from
  while (j < text.length && /[ \t]/.test(text[j])) {
    j++
  }
  return [text.substring(from, j), from, j] as const
}
/***
 * 换行或shift+tab时计算行前的空格与位置
 */
function findBeforePadding(beforeText: string) {
  const i = beforeText.lastIndexOf('\n') + 1
  return findPadding(beforeText, i)
}
/**
 * 新行。需要与上一行的tab对齐
 * @param editor 
 * @param indentOn 
 * @param tab 
 * @param e 
 */
function handleNewLine(
  editor: HTMLElement,
  indentOn: RegExp,
  tab: string,
  e: React.KeyboardEvent) {
  const before = beforeCursor(editor)
  const after = afterCursor(editor)

  const [padding] = findBeforePadding(before)
  let newLinePadding = padding

  if (indentOn.test(before)) {
    newLinePadding += tab
  }
  if (mb.browser.type == "FF" || newLinePadding.length > 0) {
    mb.DOM.preventDefault(e)
    insert('\n' + newLinePadding)
  }

  if (newLinePadding != padding && after[0] == "}") {
    const pos = mb.DOM.getSelectionRange(editor)
    insert("\n" + padding)
    mb.DOM.setSelectionRange(editor, pos)
  }
}


/**
 * 补全括号等
 * @param editor 
 * @param e 
 */
function handleSelfClosingCharacters(
  editor: HTMLElement,
  e: React.KeyboardEvent,
  closePair: string[]
) {
  const codeBefore = beforeCursor(editor)
  const codeAfter = afterCursor(editor)
  if (codeBefore.substr(codeBefore.length - 1) != '\\') {
    const end = closePair.find(v => v[1] == e.key)
    if (end && codeAfter.substr(0, 1) == e.key) {
      //后继已为某括号，不输入
      const pos = mb.DOM.getSelectionRange(editor)
      mb.DOM.preventDefault(e)
      pos.start = ++pos.end
      mb.DOM.setSelectionRange(editor, pos)
    } else {
      const begin = closePair.find(v => v[0] == e.key)
      if (begin) {
        //匹配某括号，不插入
        const pos = mb.DOM.getSelectionRange(editor)
        mb.DOM.preventDefault(e)
        const text = e.key + begin[1]
        insert(text)
        pos.start = ++pos.end
        mb.DOM.setSelectionRange(editor, pos)
      }
    }
  }
}
/**
 * 删除tab
 * @param editor 
 * @param start 
 * @param padding 
 * @param tab 
 * @returns 
 */
function deleteTab(editor: HTMLElement, start: number, padding: string, tab: string) {
  const len = Math.min(tab.length, padding.length)
  if (len > 0) {
    mb.DOM.setSelectionRange(editor, { start, end: start + len })?.deleteFromDocument()
  }
  return len
}
/**
 * 输入tab
 * @param editor 
 * @param tab 
 * @param e 
 */
function handleTabCharacters(editor: HTMLElement, tab: string, e: React.KeyboardEvent) {
  mb.DOM.preventDefault(e)
  const selection = window.getSelection()
  if (!selection) {
    return
  }
  const selected = selection.toString()
  if (selected.length > 0) {
    //多行
    const pos = mb.DOM.getSelectionRange(editor)
    const before = beforeCursor(editor)
    const [padding, start] = findBeforePadding(before)
    const inlines = selected.split('\n')
    if (e.shiftKey) {
      //删除
      //第一行
      const firstLine = before.substr(start) + inlines[0]
      const [vpadding] = findPadding(firstLine)
      let di = deleteTab(editor, start, vpadding, tab)

      let nstart = start + firstLine.length + 1 - di
      //开始减去，如果选中包含减去，则不减
      const beginSub = Math.min(padding.length, tab.length)
      let endSub = di
      //中间行
      let i = 1, end = inlines.length - 1
      while (i < end) {
        const [vpadding] = findPadding(inlines[i])
        const di = deleteTab(editor, nstart, vpadding, tab)
        nstart = nstart + inlines[i].length + 1 - di
        endSub = endSub + di
        i++
      }
      if (end != 0) {
        //最后一行
        const after = afterCursor(editor)
        const lastLine = inlines[end] + after.substr(0, after.indexOf('\n'))
        const [vpadding] = findPadding(lastLine)
        endSub = endSub + deleteTab(editor, nstart, vpadding, tab)
      }
      if (pos.start < pos.end) {
        pos.start -= beginSub
        pos.end -= endSub
      } else {
        pos.end -= beginSub
        pos.start -= endSub
      }
      mb.DOM.setSelectionRange(editor, pos)
    } else {
      //插入
      //第一行
      mb.DOM.setSelectionRange(editor, { start, end: start })
      insert(tab)
      let nstart = before.length + inlines[0].length + tab.length + 1
      //其它行
      let i = 1
      while (i < inlines.length) {
        mb.DOM.setSelectionRange(editor, { start: nstart, end: nstart })
        insert(tab)
        nstart = nstart + inlines[i].length + tab.length + 1
        i++
      }
      if (pos.start < pos.end) {
        pos.start = pos.start + tab.length
        pos.end = pos.end + (tab.length * inlines.length)
      } else {
        pos.start = pos.start + (tab.length * inlines.length)
        pos.end = pos.end + tab.length
      }
      mb.DOM.setSelectionRange(editor, pos)
    }
  } else {
    //单行
    if (e.shiftKey) {
      const before = beforeCursor(editor)
      const [padding, start] = findBeforePadding(before)
      if (padding.length > 0) {
        const pos = mb.DOM.getSelectionRange(editor)
        const len = deleteTab(editor, start, padding, tab)
        pos.start -= len
        pos.end -= len
        mb.DOM.setSelectionRange(editor, pos)
      }
    } else {
      insert(tab)
    }
  }
}
////////////////////////////////历史记录///////////////////////////////////////////////
interface HistoryRecord {
  text: string
  pos: MbRange
}

function isCtrl(e: React.KeyboardEvent) {
  return e.metaKey || e.ctrlKey
}
function isUndo(e: React.KeyboardEvent) {
  return isCtrl(e) && !e.shiftKey && mb.DOM.keyCode.Z(e)
}
function isRedo(e: React.KeyboardEvent) {
  return isCtrl(e) && e.shiftKey && mb.DOM.keyCode.Z(e)
}


function insert(text: string) {
  text = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
  document.execCommand("insertHTML", false, text)
}

/*
需要将cursor作为观察属性暴露出来，但设置cursor，是否会循环触发光标的定位？
内容改变也可作属性，只是内容改变，要设置新内容，是否触发观察？
绝对禁止从观察属性去循环改变属性本身，如内容变化通知改变内容。
*/
export interface CodeJar {
  getContent(): string
  getSelection(): MbRange
  setSelection(v: MbRange): void
}
export interface CodeJarOption {
  content?: string
  setContent(content: string): void
  tab?: string
  indentOn?: RegExp
  spellcheck?: boolean
  noClosing?: boolean
  closePair?: string[]
  height?: number
  width?: number
  readonly?: boolean
}


class HistoryManager {
  constructor(
    private changeContent: (v: string) => void
  ) { }
  private at = -1
  private historys: HistoryRecord[] = []
  current() {
    return this.historys[this.at]
  }
  undo() {
    this.at = this.at - 1
    if (this.at < 0) {
      this.at = 0
    }
    this.change()
  }
  redo() {
    this.at = this.at + 1
    if (this.at >= this.historys.length) {
      this.at = this.at - 1
    }
    this.change()
  }
  maxHistory = 300
  add(row: HistoryRecord) {
    this.at++
    this.historys[this.at] = row
    this.historys.splice(this.at + 1)
    if (this.at > this.maxHistory) {
      this.at = this.maxHistory
      this.historys.splice(0, 1)
    }
    this.change()
  }
  private change() {
    this.changeContent(this.current().text)
  }
}


export default function useCodeJar({
  tab = "\t",
  indentOn = /{$/,
  closePair = ["()", "[]", '{}', '""', "''"],
  height,
  width,
  noClosing,
  readonly,
  setContent,
  spellcheck = false,
  ...options
}: CodeJarOption & React.HTMLAttributes<HTMLDivElement>) {
  //缓存上一次向外的更新,保证下一次生效时,才能更新选择.只能有这一个content.
  const [content, setInterContent] = useState<string>(() => "")
  const history = useConstRefValue<HistoryManager>(() => new HistoryManager(v => {
    setInterContent(x => {
      if (v != x) {
        setContent(v)
      }
      return v
    })
  }))
  const recording = useRefValue(() => false)
  const focus = useRefValue(() => false)
  const editor = useRefValue(() => document.body)
  function rememberHistory() {
    if (focus.get()) {
      const text = editor.get().textContent || ''
      const pos = mb.DOM.getSelectionRange(editor.get())

      const lastRecord = history.current()
      if (lastRecord
        && lastRecord.text == text
        && lastRecord.pos.start == pos.start
        && lastRecord.pos.end == pos.end) {
        return
      }
      history.add({ text, pos })
    }
  }

  //为了保证能更新到选区.
  useEffect(() => {
    const record = history.current()
    if (record) {
      mb.DOM.setSelectionRange(editor.get(), record.pos)
    }
  }, [content])

  return useDom("div", {
    ...options,
    ref: editor.set,
    onKeyDown(e) {
      if (e.defaultPrevented) return
      if (mb.DOM.keyCode.ENTER(e)) {
        //换行
        handleNewLine(editor.get(), indentOn, tab, e)
      } else if (mb.DOM.keyCode.TAB(e)) {
        //缩进与反缩进
        handleTabCharacters(editor.get(), tab, e)
      } else if (isUndo(e)) {
        //撤销
        mb.DOM.preventDefault(e)
        history.undo()
      } else if (isRedo(e)) {
        //重做
        mb.DOM.preventDefault(e)
        history.redo()
      } else if (!noClosing) {
        //补全括号
        handleSelfClosingCharacters(editor.get(), e, closePair)
      }
      if (shouldRecord(e) && !recording.get()) {
        rememberHistory()
        recording.set(true)
      }
    },
    onKeyUp(e) {
      if (e.defaultPrevented) return
      if (e.isComposing) return
      if (shouldRecord(e) && recording.get()) {
        //记录keydown-up之间的改变。
        rememberHistory()
        recording.set(false)
      }
    },
    onFocus() {
      focus.set(true)
    },
    onBlur() {
      focus.set(false)
    },
    onPaste(e) {
      rememberHistory()
      mb.DOM.preventDefault(e)
      const text = ((e as any).originalEvent || e).clipboardData.getData("text/plain") as string
      const pos = mb.DOM.getSelectionRange(editor.get())
      insert(text)
      mb.DOM.setSelectionRange(editor.get(), {
        start: pos.start + text.length,
        end: pos.start + text.length
      })
      //粘贴的时候,内容与选中都会改变,然后记录历史
      rememberHistory()
    },
    contentEditable: readonly ? false : contentEditable.text,
    spellcheck,
    async exit(e) {
      const record = history.current()
      if (record) {
        record.pos = mb.DOM.getSelectionRange(editor.get())
      }
      return options.exit?.(e)
    },
    style: {
      outline: "none",
      overflowWrap: "break-word",
      overflowY: "auto",
      resize: height ? "none" : "vertical",
      whiteSpace: "pre-wrap",
      width: width ? width + 'px' : '',
      height: height ? height + "px" : "",
      textAlign: "left"
    }
  })
}