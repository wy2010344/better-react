import { emptyArray } from "wy-helper";
import { dom } from "better-react-dom";
import { React, DomElementType, DomElement, DomAttribute } from "wy-dom-helper";
import { useEffect, useMemo } from "better-react-helper";
import { CSSProperties, stringifyStyle } from "wy-dom-helper";
import {
  mb,
  contentEditableText,
  MbRange,
  getSelection,
  insertHTML,
  browser,
  afterCursor,
  beforeCursor,
} from "wy-dom-helper/contentEditable";
function shouldRecord(e: KeyboardEvent) {
  return (
    !isUndo(e) &&
    !isRedo(e) &&
    !mb.DOM.keyCode.META(e) &&
    !mb.DOM.keyCode.CONTROL(e) &&
    !mb.DOM.keyCode.ALT(e) &&
    !mb.DOM.keyCode.ARROWDOWN(e) &&
    !mb.DOM.keyCode.ARROWLEFT(e) &&
    !mb.DOM.keyCode.ARROWUP(e) &&
    !mb.DOM.keyCode.ARROWDOWN(e)
  );
}

/**
 * 删除tab
 * @param editor
 * @param start
 * @param padding
 * @param tab
 * @returns
 */
function deleteTab(
  editor: HTMLElement,
  start: number,
  padding: string,
  tab: string,
) {
  const len = Math.min(tab.length, padding.length);
  if (len > 0) {
    mb.DOM.setSelectionRange(editor, {
      start,
      end: start + len,
    }).deleteFromDocument();
  }
  return len;
}

/**
 * 寻找字符串从某一点开始的空格或tab
 * @param text
 * @param from
 */
function findPadding(text: string, from = 0) {
  let j = from;
  while (j < text.length && /[ \t]/.test(text[j])) {
    j++;
  }
  return [text.slice(from, j), from, j] as const;
}
/***
 * 换行或shift+tab时计算行前的空格与位置
 */
export function findBeforePadding(beforeText: string) {
  const i = beforeText.lastIndexOf("\n") + 1;
  return findPadding(beforeText, i);
}

/**
 * 输入tab
 * @param editor
 * @param tab
 * @param e
 */
export function handleTabCharacters(
  editor: HTMLElement,
  tab: string,
  e: KeyboardEvent,
) {
  mb.DOM.preventDefault(e);
  const selection = getSelection(editor);
  if (!selection) {
    return;
  }
  const selected = selection.toString();
  if (selected.length > 0) {
    //多行
    const pos = mb.DOM.getSelectionRange(editor);
    const before = beforeCursor(editor);
    const [padding, start] = findBeforePadding(before);
    const inlines = selected.split("\n");
    if (e.shiftKey) {
      //删除
      //第一行
      const firstLine = before.slice(start) + inlines[0];
      const [vpadding] = findPadding(firstLine);
      const di = deleteTab(editor, start, vpadding, tab);

      let nstart = start + firstLine.length + 1 - di;
      //开始减去，如果选中包含减去，则不减
      const beginSub = Math.min(padding.length, tab.length);
      let endSub = di;
      //中间行
      let i = 1;
      const end = inlines.length - 1;
      while (i < end) {
        const [vpadding] = findPadding(inlines[i]);
        const di = deleteTab(editor, nstart, vpadding, tab);
        nstart = nstart + inlines[i].length + 1 - di;
        endSub = endSub + di;
        i++;
      }
      if (end != 0) {
        //最后一行
        const after = afterCursor(editor);
        const lastLine = inlines[end] + after.slice(0, after.indexOf("\n"));
        const [vpadding] = findPadding(lastLine);
        endSub = endSub + deleteTab(editor, nstart, vpadding, tab);
      }
      if (!pos) {
        return;
      }
      if (pos.start < pos.end) {
        pos.start -= beginSub;
        pos.end -= endSub;
      } else {
        pos.end -= beginSub;
        pos.start -= endSub;
      }
      mb.DOM.setSelectionRange(editor, pos);
    } else {
      //插入
      //第一行
      mb.DOM.setSelectionRange(editor, { start, end: start });
      insertHTML(tab);
      let nstart = before.length + inlines[0].length + tab.length + 1;
      //其它行
      let i = 1;
      while (i < inlines.length) {
        mb.DOM.setSelectionRange(editor, { start: nstart, end: nstart });
        insertHTML(tab);
        nstart = nstart + inlines[i].length + tab.length + 1;
        i++;
      }
      if (!pos) {
        return;
      }
      if (pos.start < pos.end) {
        pos.start = pos.start + tab.length;
        pos.end = pos.end + tab.length * inlines.length;
      } else {
        pos.start = pos.start + tab.length * inlines.length;
        pos.end = pos.end + tab.length;
      }
      mb.DOM.setSelectionRange(editor, pos);
    }
  } else {
    //单行
    if (e.shiftKey) {
      const before = beforeCursor(editor);
      const [padding, start] = findBeforePadding(before);
      if (padding.length > 0) {
        const pos = mb.DOM.getSelectionRange(editor);
        const len = deleteTab(editor, start, padding, tab);

        if (!pos) {
          return;
        }
        pos.start -= len;
        pos.end -= len;
        mb.DOM.setSelectionRange(editor, pos);
      }
    } else {
      insertHTML(tab);
    }
  }
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
  moveToNewLine: RegExp,
  tab: string,
  e: KeyboardEvent,
) {
  const before = beforeCursor(editor);
  const after = afterCursor(editor);

  const [padding] = findBeforePadding(before);
  let newLinePadding = padding;

  if (indentOn.test(before)) {
    newLinePadding += tab;
  }
  if (newLinePadding.length > 0) {
    mb.DOM.preventDefault(e);
    mb.DOM.stopPropagation(e);
    insertHTML("\n" + newLinePadding);
  } else {
    legacyNewLineFix(editor, e);
  }
  if (newLinePadding != padding && moveToNewLine.test(after)) {
    const pos = mb.DOM.getSelectionRange(editor);
    insertHTML("\n" + padding);
    mb.DOM.setSelectionRange(editor, pos);
  }
}

function legacyNewLineFix(editor: HTMLElement, event: KeyboardEvent) {
  // Firefox does not support plaintext-only mode
  // and puts <div><br></div> on Enter. Let's help.
  if (browser.type == "FF") {
    mb.DOM.preventDefault(event);
    mb.DOM.stopPropagation(event);
    if (afterCursor(editor) == "") {
      insertHTML("\n ");
      const pos = mb.DOM.getSelectionRange(editor);

      if (!pos) {
        return;
      }
      pos.start = --pos.end;
      mb.DOM.setSelectionRange(editor, pos);
    } else {
      insertHTML("\n");
    }
  }
}
/**
 * 补全括号等
 * @param editor
 * @param e
 */
function handleSelfClosingCharacters(
  editor: HTMLElement,
  e: KeyboardEvent,
  /**{},[],() */
  closePair: string[],
) {
  const codeBefore = beforeCursor(editor);
  if (codeBefore.slice(codeBefore.length - 1) != "\\") {
    const codeAfter = afterCursor(editor);
    const end = closePair.find((v) => v[1] == e.key);
    const charAfter = codeAfter.slice(0, 1);
    if (end && charAfter == e.key) {
      //后继已为某括号，不输入
      const pos = mb.DOM.getSelectionRange(editor);
      mb.DOM.preventDefault(e);
      if (!pos) {
        return;
      }
      pos.start = ++pos.end;
      mb.DOM.setSelectionRange(editor, pos);
    } else {
      const begin = closePair.find((v) => v[0] == e.key);
      if (
        begin &&
        (`"'`.includes(e.key) || ["", " ", "\n"].includes(charAfter))
      ) {
        //匹配某括号，不插入
        mb.DOM.preventDefault(e);
        const pos = mb.DOM.getSelectionRange(editor);
        if (!pos) {
          return;
        }
        const wrapText =
          pos.start == pos.end ? "" : getSelection(editor).toString();
        const text = e.key + wrapText + begin[1];
        insertHTML(text);
        pos.start++;
        pos.end++;
        mb.DOM.setSelectionRange(editor, pos);
      }
    }
  }
}
////////////////////////////////历史记录///////////////////////////////////////////////
export interface HistoryRecord {
  text: string;
  pos: MbRange;
}

export function recordEqual(a: HistoryRecord, b: HistoryRecord) {
  if (a == b) {
    return true;
  }
  if (a.text != b.text) {
    return false;
  }
  if (a.pos == b.pos) {
    return true;
  }
  if (a.pos.start != b.pos.start) {
    return false;
  }
  if (a.pos.end != b.pos.end) {
    return false;
  }
  if (a.pos.dir != b.pos.dir) {
    return false;
  }
  return true;
}

function isCtrl(e: KeyboardEvent) {
  return e.metaKey || e.ctrlKey;
}
function isUndo(e: KeyboardEvent) {
  return isCtrl(e) && !e.shiftKey && mb.DOM.keyCode.Z(e);
}
function isRedo(e: KeyboardEvent) {
  return isCtrl(e) && e.shiftKey && mb.DOM.keyCode.Z(e);
}

/*
需要将cursor作为观察属性暴露出来，但设置cursor，是否会循环触发光标的定位？
内容改变也可作属性，只是内容改变，要设置新内容，是否触发观察？
绝对禁止从观察属性去循环改变属性本身，如内容变化通知改变内容。
*/
export interface CodeJar {
  getContent(): string;
  getSelection(): MbRange;
  setSelection(v: MbRange): void;
}
export interface CodeJarOption {
  record: HistoryRecord;
  setRecord(v: HistoryRecord): void;
  pretty(editor: HTMLElement, content: string): void;
  tab?: string;
  indentOn?: RegExp;
  moveToNewLine?: RegExp;

  /**禁止自闭合 */
  skipClosing?: boolean;
  /**禁止tab */
  skipIndent?: boolean;

  spellcheck?: boolean;
  closePair?: string[];
  height?: number;
  width?: number;
  readonly?: boolean;

  style?: CSSProperties;
}

class HistoryManager {
  constructor(private changeContent: (record: HistoryRecord) => void) {}
  private at = -1;
  private historys: HistoryRecord[] = [];
  reset(record: HistoryRecord) {
    this.at = 0;
    this.historys.length = 0;
    this.historys.push(record);
  }
  current() {
    return this.historys[this.at];
  }
  undo() {
    this.at = this.at - 1;
    if (this.at < 0) {
      this.at = 0;
    }
    this.change();
  }
  redo() {
    this.at = this.at + 1;
    if (this.at >= this.historys.length) {
      this.at = this.at - 1;
    }
    this.change();
  }
  maxHistory = 300;
  add(row: HistoryRecord) {
    this.at++;
    this.historys[this.at] = row;
    this.historys.splice(this.at + 1);
    if (this.at > this.maxHistory) {
      this.at = this.maxHistory;
      this.historys.splice(0, 1);
    }
    this.change();
  }
  private change() {
    this.changeContent(this.current());
  }

  recording = false;
  focus = false;
  lastState: HistoryRecord | undefined = undefined;
}

export const emptyHistoryRecord: HistoryRecord = {
  text: "",
  pos: {
    start: 0,
    end: 0,
  },
};
export function useCodeJar<T extends DomElementType>(
  tag: T,
  {
    tab = "\t",
    indentOn = /{$/,
    closePair = ["()", "[]", "{}", '""', "''"],
    moveToNewLine = /^[)}\]]/,
    skipClosing,
    skipIndent,
    height,
    width,
    readonly,
    record,
    setRecord,
    pretty,
    spellcheck = false,
    style,
    attrs,
  }: CodeJarOption & {
    attrs?: Omit<DomAttribute<T>, "style">;
  },
) {
  //缓存上一次向外的更新,保证下一次生效时,才能更新选择.只能有这一个content.
  // const [content, setInterContent] = useState<string>("")
  const history = useMemo(() => new HistoryManager(setRecord), emptyArray);
  function rememberHistory() {
    if (history.focus) {
      const text = editor.textContent || "";
      const pos = mb.DOM.getSelectionRange(editor);

      const lastRecord = history.current();
      if (!pos) {
        return;
      }
      if (
        lastRecord &&
        lastRecord.text == text &&
        lastRecord.pos.start == pos.start &&
        lastRecord.pos.end == pos.end
      ) {
        return;
      }
      history.add({ text, pos });
    }
  }
  //为了保证能更新到选区.
  useEffect(() => {
    const last = history.lastState;
    if (last?.text != record.text) {
      pretty(editor, record.text);
    }
    if (
      last?.pos.start != record.pos.start ||
      last?.pos.end != record.pos.end ||
      last.pos.dir != record.pos.dir
    ) {
      mb.DOM.setSelectionRange(editor, record.pos);
    }
    history.lastState = record;

    const current = history.current();
    if (
      (current &&
        (record.text != current.text ||
          record.pos.start != current.pos.start ||
          record.pos.end != current.pos.end ||
          record.pos.dir != current.pos.dir)) ||
      !current
    ) {
      history.reset(record);
    }
  }, [record]);

  const editor = dom[tag as "div"]({
    ...(attrs as DomAttribute<"div">),
    onKeyDown(e) {
      if (e.defaultPrevented) return;
      if (mb.DOM.keyCode.ENTER(e)) {
        //换行
        if (skipIndent) {
          legacyNewLineFix(editor, e);
        } else {
          handleNewLine(editor, indentOn, moveToNewLine, tab, e);
        }
      } else if (mb.DOM.keyCode.TAB(e)) {
        //缩进与反缩进
        handleTabCharacters(editor, tab, e);
      } else if (isUndo(e)) {
        //撤销
        mb.DOM.preventDefault(e);
        history.undo();
      } else if (isRedo(e)) {
        //重做
        mb.DOM.preventDefault(e);
        history.redo();
      } else if (!skipClosing) {
        //补全括号
        handleSelfClosingCharacters(editor, e, closePair);
      }
      if (shouldRecord(e) && !history.recording) {
        rememberHistory();
        history.recording = true;
      }
    },
    onKeyUp(e) {
      if (e.defaultPrevented) return;
      if (e.isComposing) return;
      if (shouldRecord(e) && history.recording) {
        //记录keydown-up之间的改变。
        rememberHistory();
        history.recording = false;
      }
    },
    onFocus() {
      history.focus = true;
    },
    onBlur() {
      history.focus = false;
    },
    onCut(e) {
      mb.DOM.preventDefault(e);
      rememberHistory();
      const pos = mb.DOM.getSelectionRange(editor);
      const selection = getSelection(editor);
      const originalEvent = (e as any).originalEvent ?? e;
      originalEvent.clipboardData.setData("text/plain", selection.toString());
      document.execCommand("delete");
      if (pos) {
        mb.DOM.setSelectionRange(editor, {
          start: pos.start,
          end: pos.start,
          dir: "->",
        });
      }
      rememberHistory();
    },
    onPaste(e) {
      mb.DOM.preventDefault(e);
      rememberHistory();
      const text = ((e as any).originalEvent || e).clipboardData.getData(
        "text/plain",
      ) as string;
      const pos = mb.DOM.getSelectionRange(editor);
      insertHTML(text);

      if (pos) {
        mb.DOM.setSelectionRange(editor, {
          start: Math.min(pos.start, pos.end) + text.length,
          end: Math.min(pos.start, pos.end) + text.length,
          dir: "<-",
        });
      }
      //粘贴的时候,内容与选中都会改变,然后记录历史
      rememberHistory();
    },
    spellcheck,
    contentEditable: readonly ? false : contentEditableText,
    style: stringifyStyle({
      resize: height ? "none" : "vertical",
      width: width ? width + "px" : "",
      height: height ? height + "px" : "",
      overflowY: "auto",
      ...style,
      overflowWrap: "break-word",
      whiteSpace: "pre-wrap",
      textAlign: "left",
    }),
  }).renderTextContent("");
  return editor as DomElement<T>;
}
