import { dom } from "better-react-dom";
import { emptyFun } from "wy-helper";
import { renderInput } from 'better-react-dom-helper'
import { useChange } from "better-react-helper";

import { parseGet, matchCharIn, matchAnyString, matchCharNotIn, or, ruleGet, parseSkip, runParse } from 'wy-helper/tokenParser'

export default function () {

  const [value, setValue] = useChange('')
  dom.button({
    onClick() {
      try {
        const out = runParse(value, () => ruleStrBetweenGet(
          '"'.charCodeAt(0)
        ))
        console.log(value, "结果是", out)
      } catch (er) {
        console.warn("解析失败", er)
      }
    }
  }).renderText`点击`

  renderInput("textarea", {
    value,
    onValueChange(v) {
      setValue(v)
    },
  })
}



function ruleStrBetweenGet(
  begin: number,
  end: number = begin
) {
  parseSkip(matchCharIn([begin]))
  const endChar = String.fromCharCode(end)
  const list: string[] = []
  while (true) {
    const value = or([
      () => {
        return parseGet(matchAnyString('\\\\'), () => '\\')
      },
      () => {
        return parseGet(matchAnyString(`\\${endChar}`), () => endChar)
      },
      () => {
        return parseGet(matchCharNotIn([end]), begin => begin.current())
      },
      emptyFun
    ])
    if (value) {
      list.push(value)
    } else {
      break
    }
  }
  parseSkip(matchCharIn([end]))
  return list.join('')
}