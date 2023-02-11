type MBKeyboard = {
  code?: string
  keyCode: number,
  key: string
}
function isKey(v: number, key: string, code?: string) {
  if (code) {
    return function (e: MBKeyboard) {
      return (e.keyCode == v || e.key == key) && e.code == code
    }
  } else {
    return function (e: MBKeyboard) {
      return e.keyCode == v || e.key == key
    }
  }
}

function restoreVerifyPos(pos: MbRange) {
  var _a;
  var dir = pos.dir;
  var start = pos.start;
  var end = pos.end;
  if (!dir) {
    dir = "->";
  }
  if (start < 0) {
    start = 0;
  }
  if (end < 0) {
    end = 0;
  }
  if (dir == "<-") {
    //交换开始与结束的位置，以便顺序遍历
    _a = [end, start], start = _a[0], end = _a[1];
  }
  return [start, end, dir] as const
}
function visit(editor: Node, visitor: (el: Node) => boolean | void) {
  var queue = [];
  if (editor.firstChild) {
    queue.push(editor.firstChild);
  }
  var el = queue.pop();
  while (el) {
    if (visitor(el)) {
      break;
    }
    if (el.nextSibling) {
      queue.push(el.nextSibling);
    }
    if (el.firstChild) {
      queue.push(el.firstChild);
    }
    el = queue.pop();
  }
};
export interface MbRange {
  start: number
  end: number
  dir?: "->" | "<-"
}

export function MBRangeEqual(a: MbRange, b: MbRange) {
  return a.start == b.start && a.end == b.end && a.dir == b.dir
}


const mb = {
  DOM: {
    addEvent(v: any, key: string, fun: any) {
      v.addEventListener(key, fun)
    },
    removeEvent(v: any, key: string, fun: any) {
      v.removeEventListener(key, fun)
    },
    preventDefault(e: any) {
      e.preventDefault()
    },
    stopPropagation(e: any) {
      e.stopPropagation()
    },
    getSelectionRange(editor: HTMLElement) {
      var s = window.getSelection();
      var pos: MbRange = { start: 0, end: 0 };
      visit(editor, function (el) {
        if (!s) {
          return
        }
        if (el.nodeType != Node.TEXT_NODE)
          return;
        if (el == s.anchorNode) {
          if (el == s.focusNode) {
            pos.start += s.anchorOffset;
            pos.end += s.focusOffset;
            pos.dir = s.anchorOffset <= s.focusOffset ? "->" : "<-";
            return true;
          }
          else {
            pos.start += s.anchorOffset;
            if (pos.dir) {
              return true;
            }
            else {
              //选遇到开始点
              pos.dir = "->";
            }
          }
        }
        else if (el == s.focusNode) {
          pos.end += s.focusOffset;
          if (pos.dir) {
            return true;
          }
          else {
            //先遇到结束点
            pos.dir = "<-";
          }
        }
        if (el.nodeType == Node.TEXT_NODE) {
          var len = (el.nodeValue || "").length;
          if (pos.dir != "->") {
            pos.start += len;
          }
          if (pos.dir != "<-") {
            pos.end += len;
          }
        }
      });
      return pos;
    },
    setSelectionRange(editor: Node, pos: MbRange) {
      var _a;
      var s = window.getSelection();
      var startNode: Node | undefined = undefined, startOffset = 0;
      var endNode, endOffset = 0;
      var _b = restoreVerifyPos(pos), start = _b[0], end = _b[1], dir = _b[2];
      var current = 0;
      visit(editor, function (el) {
        if (el.nodeType != Node.TEXT_NODE)
          return false;
        var len = (el.nodeValue || "").length;
        if (current + len >= start) {
          if (!startNode) {
            startNode = el;
            startOffset = start - current;
          }
          if (current + len >= end) {
            endNode = el;
            endOffset = end - current;
            return true;
          }
        }
        current += len;
        return false
      });
      if (!startNode) {
        startNode = editor;
      }
      if (!endNode) {
        endNode = editor;
      }
      if (dir == "<-") {
        _a = [endNode, endOffset, startNode, startOffset] as const;
        startNode = _a[0], startOffset = _a[1], endNode = _a[2], endOffset = _a[3];
      }
      s?.setBaseAndExtent(startNode, startOffset, endNode, endOffset);
      return s;
    },

    keyCode: {
      BACKSPACE: isKey(8, "Backspace"),
      ENTER: isKey(13, "Enter"),
      TAB: isKey(9, "Tab"),
      ESCAPE: isKey(27, "Escape"),
      CAPSLOCK: isKey(20, 'CapsLock'),

      ARROWLEFT: isKey(37, "ArrowLeft"),
      ARROWUP: isKey(38, "ArrowUp"),
      ARROWRIGHT: isKey(39, "ArrowRight"),
      ARROWDOWN: isKey(40, "ArrowDown"),

      CONTROL: isKey(17, "Control"),

      /**shift键 */
      SHIFT: isKey(16, 'Shift'),
      SHIFTLEFT: isKey(16, 'Shift', 'ShiftLeft'),
      SHIFTRIGHT: isKey(16, 'Shift', 'ShiftRight'),

      /**windows键 */
      META: isKey(91, "Meta"),
      METALEFT: isKey(91, "Meta", "MetaLeft"),
      METARIGHT: isKey(91, "Meta", "MetaRight"),

      /**ALT键 */
      ALT: isKey(18, "Alt"),
      ALTLEFT: isKey(18, "Alt", "AltLeft"),
      ALTRIGHT: isKey(18, "Alt", "AltRight"),


      A: isKey(65, 'a'),
      Z: isKey(90, "z"),
      V: isKey(86, "v"),
      C: isKey(67, "c"),
      X: isKey(88, "x")
    }
  },
  isIE: false,
  browser: {
    type: "IE",
    version: 0,
    documentMode: 0
  } as Browser
}
type Browser = {
  type: "IE" | "FF" | "Opera" | "Safari",
  version: number
  documentMode: any
}
export const browser = (function () {
  //http://www.jb51.net/article/50464.htm
  var ret: Browser = {
    type: "FF", version: 0, documentMode: ""
  };
  var userAgent = navigator.userAgent; //取得浏览器的userAgent字符串
  var isOpera = userAgent.indexOf("Opera") > -1; //判断是否Opera浏览器
  var isIE = userAgent.indexOf("compatible") > -1 && userAgent.indexOf("MSIE") > -1 && !isOpera; //判断是否IE浏览器
  var isFF = userAgent.indexOf("Firefox") > -1; //判断是否Firefox浏览器
  var isSafari = userAgent.indexOf("Safari") > -1; //判断是否Safari浏览器
  if (isIE) {
    mb.isIE = true;
    var reIE = new RegExp("MSIE (\\d+\\.\\d+);");
    reIE.test(userAgent);
    ret.type = "IE";
    ret.version = parseFloat(RegExp["$1"]);
    ret.documentMode = (document as any).documentMode;//IE的文档模式
  }
  if (isFF) {
    ret.type = "FF";
  }
  if (isOpera) {
    ret.type = "Opera";
  }
  if (isSafari) {
    ret.type = "Safari";
  }
  return ret;
})();

export const contentEditable = {
  text: browser.type == "FF" ? true : "plaintext-only"
} as const
export default mb