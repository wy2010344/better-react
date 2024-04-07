

import { emptyFun, quote } from "wy-helper";
import { Que, andMatch, andRuleGet, isChinese, isLowerEnglish, isNumber, isParseSuccess, isUpperEnglish, manyMatch, manyRuleGet, match, matchEnd, notMatchBetween, notMathChar, orMatch, orRuleGet, ruleGet, ruleGetString, ruleStrBetweenGet, whiteList, whiteSpaceRule, whiteSpaceRuleZero } from "wy-helper/tokenParser";


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

const parseString = ruleStrBetweenGet("'", "'")


const matchCommonExt = manyMatch(
  orMatch(
    isUpperEnglish.getMatchBetween(),
    isLowerEnglish.getMatchBetween(),
    isNumber.getMatchBetween(),
    isChinese.getMatchBetween()
  )
)
const varRule = andMatch(
  orMatch(
    isUpperEnglish.getMatchBetween(),
    match('某'),
    match('_')
  ),
  matchCommonExt
)

const symbolRule = andMatch(
  orMatch(
    isLowerEnglish.getMatchBetween(),
    isChinese.replaceExcludes('某'.charCodeAt(0)).getMatchBetween(),
  ),
  matchCommonExt
)


const numberRule = andMatch(
  orMatch(
    match('0'),
    andMatch(
      isNumber.replaceExcludes('0'.charCodeAt(0)).getMatchBetween(),
      manyMatch(isNumber.getMatchBetween())
    )
  ),
  orMatch(
    andMatch(
      match('.'),
      manyMatch(isNumber.getMatchBetween)
    ),
    emptyFun
  )
)


const keyAndMatch = andMatch(
  symbolRule,
  match(':')
)



export interface Token {
  begin: number
  end: number
  errors: string[]
}

interface StringToken extends Token {
  type: "string"
  originalValue: string
  value: string
}

interface VarToken extends Token {
  type: "var"
  value: string
}

interface SymbolToken extends Token {
  type: "symbol"
  value: string
}

interface NumberToken extends Token {
  type: "number"
  value: number
  originalValue: string
}

interface MatchToken extends Token {
  type: "match"
  value: string
}

const ruleGetSymbol = ruleGet(symbolRule, function (begin, end) {
  const value = begin.content.slice(begin.i, end.i)
  return {
    type: "symbol",
    begin: begin.i,
    end: end.i,
    errors: [],
    value
  } as SymbolToken
})
/**
 * 节点
 * 包括
 * 1.变量 大写开头 _开头 某开头
 * 2.符号 普通
 * 3.数字
 * 4.字符串
 * 5.()括号包括的优先级
 * 6.[]包括的列表
 */
const ruleGetNode = orRuleGet(
  ruleGet(stringRule, function (begin, end) {
    const originalValue = begin.content.slice(begin.i, end.i)
    const errors: string[] = []
    if (!originalValue.endsWith("'")) {
      errors.push("没有结束符号")
    }
    const out = parseString(new Que(originalValue))
    let value = originalValue
    if (!isParseSuccess(out)) {
      errors.push('解析字符串失败')
    } else {
      value = out.value
    }
    return {
      type: "string",
      value,
      originalValue,
      begin: begin.i,
      end: end.i,
      errors
    } as StringToken
  }),
  ruleGet(varRule, function (begin, end) {
    const value = begin.content.slice(begin.i, end.i)
    return {
      type: "var",
      begin: begin.i,
      end: end.i,
      errors: [],
      value
    } as VarToken
  }),
  ruleGetSymbol,
  ruleGet(numberRule, function (begin, end) {
    const value = begin.content.slice(begin.i, end.i)
    return {
      type: "number",
      begin: begin.i,
      end: end.i,
      errors: [],
      value: Number(value),
      originalValue: value
    } as NumberToken
  })
)



const whiteSpaceRuleGet = ruleGet(whiteSpaceRuleZero, quote)

const ruleGetTerm = andRuleGet(
  [
    ruleGetNode,
    whiteSpaceRuleGet,
    orRuleGet(
      ruleGetSymbol,
      manyRuleGet(
        andRuleGet(
          [
            ruleGet(keyAndMatch, function (begin, end) {
              const value = begin.content.slice(begin.i, end.i)
              return {
                type: "match",
                begin: begin.i,
                end: end.i,
                errors: [],
                value
              } as MatchToken
            }),
            whiteSpaceRuleGet,
            ruleGetNode
          ],
          function (a, b, c) {
            return {
              type: "manyMatch",
              match: a,
              value: c
            } as const
          }
        ))
    )
  ],
  function (a, b, c) {
    return {
      type: "term",
      value: a,
      ext: c
    } as const
  }
)


/**
 * and的两边
 * 1.term
 * 2.括号代表优先级的term
 * 3.Var,表示eval
 * 4.and本身的级联
 */
const andRule = andRuleGet(
  [
    rul
  ],
  function () {

  }
)


/**
 * or的两边
 * 因为or的优先级较低
 * 1.and语句
 * 2.term
 * 3.括号代表优先级的term
 * 3.Var
 * 4.or本身的级联
 */


/**
 * 括号表优级的term
 * 本身是
 * 1.and
 * 2.or
 */
// const ruleRule = andRuleGet(
//   [

//   ],
//   function () {

//   }
// )