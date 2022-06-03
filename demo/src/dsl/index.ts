import { normalPanel } from "../panel/PanelContext"
import useCodeJar from "../panel/useCodeJar"
import { tokenize } from "./tokenize2"
import { parse } from "./parser2"
import { VSToken } from "./vscode"
export default normalPanel(function (operate, id) {
  useCodeJar({
    setContent(v) {
      const list = tokenize(v)
      const tree = parse(list.filter(v => v.type == 'block') as unknown as VSToken[])
      console.log(list, tree ? tree.value : null)
    }
  })
})