import { normalPanel } from "../panel/PanelContext"
import { tokenize } from "./tokenize2"
import { parse } from "./parser2"
import { VSToken } from "./vscode"
import { useChange } from "better-react-helper"
import { useDom } from "better-react-dom"
import { initHightlight, initPrisma, prismStyle, useCodeJar, emptyHistoryRecord } from "better-react-dom-helper"
const { currentStyle, highlightElement, styleList } = initPrisma({
  initStyle: ""
})
export default normalPanel(function (operate, id) {
  const [record, setRecord] = useChange(emptyHistoryRecord)
  const select = useDom("select", {
    onInput(event) {
      currentStyle.set(select.value)
    },
    children() {
      for (const style of styleList) {
        useDom("option", {
          value: style,
          textContent: style
        })
      }
    },
  })
  useCodeJar("code", {
    className: "language-js",
    style: {
      display: "block"
    },
    record,
    setRecord,
    pretty(editor, content) {
      editor.innerHTML = content
      highlightElement(editor)
    }
    // setContent(v) {
    //   setContent(v)
    //   console.log(v)
    //   const list = tokenize(v)
    //   const tree = parse(list.filter(v => v.type == 'block') as unknown as VSToken[])
    //   console.log(list, tree ? tree.value : null)
    // }
  })

  useDom("div", {
    contentEditable: true,
    onInput(e) {
      console.log("cs", e)
    }
  })
})