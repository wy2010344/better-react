
import { Que, andMatch, manyMatch, manyRuleGet, match, matchEnd, notMathChar, orMatch, orRuleGet, ruleGet, whiteList, whiteSpaceRule } from "./tokenParser";

export type LToken = ({
  value: string
  begin: number
  end: number
  errors: string[]
} & ({
  type: "string"
} | {
  type: "comment"
} | {
  //可能是symbol\var\数字
  type: "block"
} | {
  type: "var"
} | {
  type: "white"
}))
const commentRule = andMatch(
  match('"'),
  manyMatch(
    orMatch(
      match('\\"'),
      notMathChar('"'.charCodeAt(0))
    )
  ),
  orMatch(
    matchEnd,
    match('"')
  )
)
const stringRule = andMatch(
  match("'"),
  manyMatch(
    orMatch(
      match("\\'"),
      notMathChar("'".charCodeAt(0))
    )
  ),
  orMatch(
    matchEnd,
    match("'")
  )
)
const varRule = andMatch(
  match('{'),
  manyMatch(
    orMatch(
      match("\\}"),
      notMathChar("}".charCodeAt(0))
    )
  ),
  orMatch(
    matchEnd,
    match('}')
  )
)
/**
 * 默认以pair相连,小括号优先级,大括号变成列表,最后自动增加空,
 * : 表示规则的cut
 * | 表示条件的cut
 */
export const keywords = ['(', ')', '[', ']', '=', ',', ';', '.', ':', '|']
const blockCharNotList = '"\'{}'.split("").concat(whiteList).concat(keywords)
export function includeBlockNotChar(v: string) {
  for (const c of blockCharNotList) {
    if (v.includes(c)) {
      return true
    }
  }
  return false
}
const blockCharRule = notMathChar(...blockCharNotList.map(v => v.charCodeAt(0)))
const blockRule = orMatch(
  match(...keywords),
  manyMatch(blockCharRule, 1)
)

const tokenRuleGet = manyRuleGet<Que, LToken>(orRuleGet(
  ruleGet(whiteSpaceRule, function (begin, end) {
    return {
      type: "white",
      begin: begin.i,
      end: end.i,
      value: begin.content.slice(begin.i, end.i),
      errors: []
    }
  }),
  ruleGet<Que, LToken>(stringRule, function (begin, end) {
    const value = begin.content.slice(begin.i, end.i)
    const errors: string[] = []
    if (!value.endsWith("'")) {
      errors.push("没有结束符号")
    }
    return {
      type: "string",
      value,
      begin: begin.i,
      end: end.i,
      errors
    }
  }),
  ruleGet<Que, LToken>(varRule, function (begin, end) {
    const value = begin.content.slice(begin.i, end.i)
    const errors: string[] = []
    if (!value.endsWith("}")) {
      errors.push("没有结束符号")
    }
    return {
      type: "var",
      value,
      begin: begin.i,
      end: end.i,
      errors
    }
  }),
  ruleGet(commentRule, function (begin, end) {
    const value = begin.content.slice(begin.i, end.i)
    const errors: string[] = []
    if (!value.endsWith('"')) {
      errors.push("没有结束符号")
    }
    return {
      type: "comment",
      value,
      begin: begin.i,
      end: end.i,
      errors
    }
  }),
  ruleGet(blockRule, function (begin, end) {
    return {
      type: "block",
      begin: begin.i,
      end: end.i,
      value: begin.content.slice(begin.i, end.i),
      errors: []
    }
  }),
))

export function tokenize(content: string): LToken[] {
  const result = tokenRuleGet(new Que(content))
  if (result) {
    const tokens = result.value
    return tokens
  } else {
    return []
  }
}
