import { useState } from "better-react";
import { useDom } from "better-react-dom";
import { normalPanel } from "./panel/PanelContext";

export default normalPanel(function (operate) {
  const [preText, setPreText] = useState('')
  useDom("button", {
    textContent: "点击",
    async onClick() {
      const text = await navigator.clipboard.readText()
      console.log(text)
      const list = text.split('\n').filter(v => v)
      console.log(list)
      const newList: string[] = []
      let addText = false
      if (list.length) {
        let i = 0
        while (i < list.length) {
          const row = list[i].trim()
          if (row.startsWith("/*")) {
            //是注释
            if (row.startsWith("/* text/")) {
              const newStr = row.slice(7, row.length - 3).replaceAll("/", ".").replaceAll("-", "_")
              newList.push(`\${preset${newStr}}`)
              addText = true
            }
          } else {
            const lastRow = list[i - 1]
            if (lastRow && lastRow.startsWith("/* color/")) {
              //是border
              const replace = replacePX(row)
              newList.push(replace.replace(COLORREG, function (vs) {
                return getColorStr(lastRow)
              }).replace(RGBACOLORREG, function (vs) {
                console.log("vss", vs)
                return getColorStr(lastRow)
              }))
            } else {
              if (!(addText && isText(row))) {
                const newRow = replacePX(row)
                newList.push(newRow)
              }
            }
          }
          i++
        }
      }
      const replaceText = newList.join('\n')
      navigator.clipboard.writeText(replaceText)
      setPreText(replaceText)
    }
  })
  useDom("pre", {
    textContent: preText
  })
})

const RGBACOLORREG = /[rR][gG][Bb][Aa]?[\(]([\s]*(2[0-4][0-9]|25[0-5]|[01]?[0-9][0-9]?),){2}[\s]*(2[0-4][0-9]|25[0-5]|[01]?[0-9][0-9]?),?[\s]*(0\.\d{1,2}|1|0)?[\)]{1}/

const COLORREG = /#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})/
function getColorStr(lastRow: string) {
  const newStr = lastRow.slice(8, lastRow.length - 3).replaceAll("/", ".").replaceAll("-", "_")
  return `\${preset.color${newStr}}`
}

const reg = /((\-|\+)?\d+(\.\d+)?)+(px)/gi;
function replacePX(row: string) {
  const newRow = row.replace(reg, function (x) {
    console.log(x)
    return `\${rem(${x.slice(0, -2)})}`
  })
  return newRow
}

function isText(row: string) {
  for (const n of textDefine) {
    if (row.startsWith(n)) {
      return true
    }
  }
  return false;
}

const textDefine = [
  "font-family",
  "font-weight",
  "font-style",
  "font-size",
  "line-height"
]