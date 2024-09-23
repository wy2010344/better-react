import { useState } from "better-react-helper";
import { dom } from "better-react-dom";
import { getColorStrBase } from "./copyToCss";
import renderCopyToCss from './copyToCss'
import setInspectStyle from './inspectStyle'
import getFigmaSvg from "./getFigma/svg";
import getFigmaPng from "./getFigma/png";
import xmlToBetter, { parseXmlToText } from "@/xmlToBetter";
export default function () {
  const [preText, setPreText] = useState('')

  function setText(v: string) {
    navigator.clipboard.writeText(v)
    setPreText(v)
  }
  setInspectStyle(setText)
  renderCopyToCss(setText)
  getFigmaSvg(setText)
  getFigmaPng(setText)
  dom.button({
    className: "btn",
    async onClick() {
      const text = await navigator.clipboard.readText()
      const replaceText = parseXmlToText(text)
      setText(replaceText)
    }
  }).renderText`xml2better`
  dom.button({
    className: "btn",
    async onClick(e) {
      const text = await navigator.clipboard.readText()
      const replaceText = getColorStrBase(text)
      setText(replaceText)
    }
  }).renderTextContent("替换颜色")
  dom.button({
    className: "btn",
    async onClick(e) {
      const text = await navigator.clipboard.readText()
      const first = text.split('\n')[0]
      let replaceText = ''
      if (first.startsWith(StyleName)) {
        replaceText = `\${preset.text.${first.slice(StyleName.length).replaceAll("/", ".").replaceAll("-", "_")}}`
      }
      setText(replaceText)
    }
  }).renderTextContent("获得字体样式")
  dom.pre().renderTextContent(preText)
}
const StyleName = '//styleName: '
