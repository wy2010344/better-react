import { dom } from "better-react-dom"

export default function (setPreText: (v: string) => void) {
  dom.button({
    className: "btn",
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
          if (row.startsWith("font-family")) {

          } else if (row.startsWith("/*")) {
            //是注释
            // if (row.startsWith("/* text/")) {
            //   const newStr = row.slice(7, row.length - 3).replaceAll("/", ".").replaceAll("-", "_")
            //   newList.push(`\${preset${newStr}}`)
            //   addText = true
            // }
          } else {
            const lastRow = list[i - 1]
            if (lastRow && lastRow.startsWith("/* color/")) {
              //是border
              const replace = replacePX(row)
              newList.push(replace.replace(COLORREG, function (vs) {
                return getColorStr(lastRow)
              }).replace(RGBACOLORREG, function (vs) {
                return getColorStr(lastRow)
              }))
            } else {
              if (row.includes('var(--color')) {
                //@todo 不是很好
                const [first, second] = row.split('var(--color')
                const [color_path] = second.split(',')
                const colorPaths = color_path.split('-')
                newList.push(`${first}\${preset.color.${colorPaths.join('.')}};`)
              } else if (!(addText && isText(row))) {
                const newRow = replacePX(row)
                newList.push(newRow)
              }
            }
          }
          i++
        }
      }
      const replaceText = newList.join('\n')
      setPreText(replaceText)
    }
  }).renderTextContent("点击-figma-2-css")
}


const RGBACOLORREG = /[rR][gG][Bb][Aa]?[\(]([\s]*(2[0-4][0-9]|25[0-5]|[01]?[0-9][0-9]?),){2}[\s]*(2[0-4][0-9]|25[0-5]|[01]?[0-9][0-9]?),?[\s]*(0\.\d{1,2}|1|0)?[\)]{1}/

const COLORREG = /#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})/
function getColorStr(lastRow: string) {
  const newStr = lastRow.slice(8, lastRow.length - 3)
  return getColorStrBase(newStr)
}

export function getColorStrBase(str: string) {
  return `\${preset.color.${str.replaceAll("/", ".").replaceAll("-", "_")}}`
}

const reg = /((\-|\+)?\d+(\.\d+)?)+(px)/gi;
export function replacePX(row: string) {
  const newRow = row.replace(reg, function (x) {
    console.log(x)
    return `\${rem(${x.slice(0, -2)})}`
  })
  return newRow
}





const textDefine = [
  "font-family",
  "font-weight",
  "font-style",
  "font-size",
  "line-height"
]
function isText(row: string) {
  for (const n of textDefine) {
    if (row.startsWith(n)) {
      return true
    }
  }
  return false;
}