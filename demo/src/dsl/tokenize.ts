import { Range } from './vscode'
import { andMatch, getRange, LineCharQue, manyMatch, manyRuleGet, match, notMathChar, orMatch, orRuleGet, ParseFun, Que, ruleGet, ruleGetString, whiteList, whiteSpaceRule } from './tokenParser'

/**
 * 第一步,变成列表
 * 第二步,变成树
 * 第三步,树的细化
 */

export type TlcToken = ({
  /**原始值 */
  value: string
  /**位置,指开始行字符与结束行字符*/
  range: Range
} & ({
  type: "string"
  error?: boolean
} | {
  type: "comment"
  error?: boolean
} | {
  type: "block"
})) | {
  type: "white"
}

const keywords = ['(', ')']
const blockCharNotList = '"`'.split("").concat(whiteList).concat(keywords).map(v => v.charCodeAt(0))

const errorStringRule = andMatch(
  match('"'),
  manyMatch(
    orMatch(
      match('\\"'),
      notMathChar('"'.charCodeAt(0))
    )
  )
)

const stringRule = andMatch(
  match('"'),
  manyMatch(
    orMatch(
      match('\\"'),
      notMathChar('"'.charCodeAt(0))
    )
  ),
  match('"')
)


const errorCommitRule = andMatch(
  match('`'),
  manyMatch(
    orMatch(
      match('\\`'),
      notMathChar('`'.charCodeAt(0))
    )
  )
)

const commitRule = andMatch(
  match('`'),
  manyMatch(
    orMatch(
      match('\\`'),
      notMathChar('`'.charCodeAt(0))
    )
  ),
  match('`')
)


const blockCharRule = notMathChar(...blockCharNotList)

const blockRule = orMatch(
  match(...keywords),
  manyMatch(blockCharRule, 1)
)

const tokenRuleGet = manyRuleGet<LineCharQue, TlcToken>(orRuleGet(
  ruleGet(whiteSpaceRule, function (begin, end) {
    return {
      type: "white"
    }
  }),
  ruleGet<LineCharQue, TlcToken>(stringRule, function (begin, end) {
    return {
      type: "string",
      value: ruleGetString(begin, end),
      range: getRange(begin, end)
    }
  }),
  ruleGet(commitRule, function (begin, end) {
    return {
      type: "comment",
      value: ruleGetString(begin, end),
      range: getRange(begin, end)
    }
  }),
  ruleGet(errorStringRule, function (begin, end) {
    return {
      type: "string",
      error: true,
      value: ruleGetString(begin, end),
      range: getRange(begin, end)
    }
  }),
  ruleGet(errorCommitRule, function (begin, end) {
    return {
      type: "comment",
      error: true,
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
  }),
))
/**
 * 拆分词
 * @param uri 
 * @param content 
 */
export function tokenize(content: string): TlcToken[] {
  const result = tokenRuleGet(new LineCharQue(content))
  if (result) {
    return result.value
  } else {
    return []
  }
}