import { fdom } from "better-react-dom"
import { renderArray, useState } from "better-react-helper"
import { emptyArray, quote } from "wy-helper"

export default function () {
  const [list, setList] = useState(emptyArray as number[])
  renderArray(list, quote, (row, i) => {
    fdom.div({
      children() {
        fdom.span({
          childrenType: 'text',
          children: `第${i + 1}行,内容是${row}`
        })
        fdom.button({
          childrenType: "text",
          children: "删除",
          onClick() {
            setList(list => list.filter(item => item != row))
          }
        })
      }
    })
  })
  fdom.button({
    childrenType: "text",
    children: '添加',
    onClick() {
      setList(list => list.concat(Date.now()))
    }
  })
}