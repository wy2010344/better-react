import { getRange } from './tokenParser'
import { Range } from './vscode'
import { andMatch, LineCharQue, manyMatch, manyRuleGet, match, notMathChar, orMatch, orRuleGet, ParseFun, Que, ruleGet, ruleGetString, whiteList, whiteSpaceRule } from '@/kanren-logic'



export type OreToken = {
  type: "comment" | "block"
  value: string
  range: Range
} | {
  type: "white"
}


const commentRule = andMatch(
  match(';'),
  manyMatch(
    orMatch(
      match('\\n'),
      notMathChar('\n'.charCodeAt(0))
    )
  )
)

const keywords = whiteList.concat('();'.split('')).map(v => v.charCodeAt(0))
const blockCharRule = notMathChar(...keywords)
const blockRule = orMatch(
  match('(', ')'),
  manyMatch(blockCharRule, 1)
)


const tokenRuleGet = manyRuleGet<LineCharQue, OreToken>(orRuleGet(
  ruleGet(whiteSpaceRule, function (begin, end) {
    return {
      type: "white"
    }
  }),
  ruleGet<LineCharQue, OreToken>(commentRule, function (begin, end) {
    return {
      type: "comment",
      value: ruleGetString(begin, end),
      range: getRange(begin, end)
    }
  }),
  ruleGet(blockRule, function (begin, end) {
    return {
      type: "block",
      value: ruleGetString(begin, end),
      range: getRange(begin, end)
    }
  })
))


export function tokenize(content: string): OreToken[] {
  const result = tokenRuleGet(new LineCharQue(content))
  if (result) {
    return result.value
  } else {
    return []
  }
}