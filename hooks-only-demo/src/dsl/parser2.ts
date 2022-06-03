import { astAndRuleGet, astDelayRuleGet, astEndRule, astManyRuleGet, astMatch, astNotMatch, astOrMatch, astOrRuleGet, AstParseFun, AstParseFunGet, astRuleGet } from './astParser'
import { VSToken, Range } from './vscode'



export type ASTTreeItem = {
  type: "branch"
  beginToken: VSToken
  endToken: VSToken
  begin: Range
  end: Range
  children: ASTTreeItem[]
} | {
  type: "branch"
  error: true
  beginToken: VSToken
  begin: Range
  children: ASTTreeItem[]
} | {
  type: "leaf"
  range: Range
  value: string
  token: VSToken
} | {
  error: true
  range: Range
  value: ")"
  token: VSToken
}


const notQuote = astRuleGet<ASTTreeItem>(
  astNotMatch("variable", "(", ")"),
  function (list, begin, end) {
    const token = list[begin]
    return {
      type: "leaf",
      token,
      range: token.range,
      value: token.value
    }
  }
)

const item = astOrRuleGet<ASTTreeItem>(
  notQuote,
  astDelayRuleGet(() => quoteRuleList),
  astDelayRuleGet(() => quoteRuleErrorList),
) as AstParseFunGet<ASTTreeItem>

const ruleList = astManyRuleGet(item)

const topRuleList = astManyRuleGet(astOrRuleGet<ASTTreeItem>(
  notQuote,
  astDelayRuleGet(() => quoteRuleList),
  astDelayRuleGet(() => quoteRuleErrorList),
  astRuleGet(astMatch("keyword", ")"), (list, begin, end): ASTTreeItem => {
    const token = list[begin]
    return {
      error: true,
      range: token.range,
      value: ")",
      token
    }
  }),
))

const quoteRuleList = astAndRuleGet(
  [
    astRuleGet(astMatch("keyword", "("), (list, begin, end) => list[begin]),
    ruleList,
    astRuleGet(astMatch("keyword", ")"), (list, begin, end) => list[begin]),
  ],
  function (a1, a2, a3): ASTTreeItem {
    return {
      type: "branch",
      children: a2,
      begin: a1.range,
      end: a3.range,
      beginToken: a1,
      endToken: a3
    }
  }
)
const quoteRuleErrorList = astAndRuleGet(
  [
    astRuleGet(astMatch("keyword", "("), (list, begin, end) => list[begin]),
    ruleList,
    astRuleGet(astEndRule, () => null)
  ],
  function (a1, a2): ASTTreeItem {
    return {
      type: "branch",
      error: true,
      children: a2,
      begin: a1.range,
      beginToken: a1
    }
  }
)


export function parse(list: VSToken[]) {
  const result = topRuleList(list, 0)
  return result
}