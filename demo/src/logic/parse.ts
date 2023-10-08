import { quote } from "better-react";
import { LToken, keywords } from "./tokenize";

type LString = {
  type: "string"
  errors: string[]
  begin: number
  end: number
  value: string
  originalValue: string
}
type LVar = {
  type: "var"
  errors: string[]
  begin: number
  end: number
  value: string
  originalValue: string
}
type LBlock = {
  type: "block"
  begin: number
  end: number
  value: string
  errors: string[]
}
/**
 * [a b c]
 * []
 */
export type LList = {
  type: "[]"
  begin: number
  end: number
  content?: LExp
}

/**
 * (a) (a b c)
 */
export type LBracket = {
  type: "()"
  begin: number
  end: number
  content: LExp
}
/**
 * 就是默认的a b c d
 */
export type LPairs = {
  type: "pairs"
  begin: number
  end: number
  children: LExp[]
}
/**表达式 */
export type LExp = LAndExp | LOrExp | LBlock | LVar | LString | LList | LBracket | LPairs
export type LAndExp = {
  type: "and",
  begin: number
  end: number
  left: LExp
  right: LExp
}
export type LOrExp = {
  type: "or"
  isCut?: boolean
  begin: number
  end: number
  left: LExp
  right: LExp
}
/**规则 */
export type LRule = {
  type: "rule",
  isCut?: boolean
  head: LExp,
  begin: number
  end: number
  body?: LExp
}

export type ErrorArea = {
  error: string
  begin: number
  end: number
}

type FilterType = LString | LBlock | LVar
export function parse(tokens: LToken[]) {
  const errorAreas: ErrorArea[] = []
  const filterTokens = tokens.reduce<FilterType[]>((init, v, i) => {
    if (v.type == 'block') {
      init.push({
        type: "block",
        begin: v.begin,
        end: v.end,
        value: v.value,
        errors: v.errors
      })
    } else if (v.type == 'string') {
      const errors = v.errors
      const value = toStringEscape(v.value, "'", errors)
      init.push({
        type: "string",
        begin: v.begin,
        end: v.end,
        value,
        errors,
        originalValue: v.value
      })
    } else if (v.type == 'var') {
      const errors = v.errors
      const value = toStringEscape(v.value, '}', errors).trim()
      if (value.includes('  ')) {
        errors.push("变量最好不要有两个空格")
      }
      if (value.includes('\r') || value.includes('\n')) {
        errors.push("变量不应该有换行符号")
      }
      if (value.includes('\t')) {
        errors.push("变量不应该有tab符号")
      }
      init.push({
        type: "var",
        begin: v.begin,
        end: v.end,
        value,
        errors,
        originalValue: v.value
      })
    }
    return init
  }, [])
  // //区分成规则集合
  const splitRules = filterTokens.reduce<{
    begin: number
    end: number
    children: FilterType[]
  }[]>(function (init, row) {
    const last = init.at(-1)!
    if (row.type == 'block' && row.value == ".") {
      last.end = row.end
      init.push({
        begin: 0,
        end: 0,
        children: []
      })
    } else {
      if (!last.children.length) {
        last.begin = row.begin
      }
      last.children.push(row)
    }
    return init
  }, [{
    begin: 0,
    end: 0,
    children: []
  }])

  if (splitRules.at(-1)?.children.length) {
    //最后不能.结尾
    splitRules.at(-1)!.end = filterTokens.at(-1)!.end
  } else {
    //最后以点结尾
    splitRules.pop()
  }

  const rules = splitRules.reduce<LRule[]>(function (init, rule) {
    //规则用等号分割
    const list: FilterType[][] = [[]]
    let will = true
    let i = 0
    let isCutRule = false
    while (will && i < rule.children.length) {
      const block = rule.children[i]
      if (block.type == 'block' && block.value == '=' || block.value == ':') {
        isCutRule = block.value == ':'
        if (list.length == 2) {
          will = false
          errorAreas.push({
            error: "过多的等号后的内容",
            begin: block.begin,
            end: rule.end
          })
        } else {
          list.push([])
        }
      } else {
        list.at(-1)?.push(block)
      }
      i++
    }
    const head = list[0]
    const body = list[1]
    if (head) {
      init.push({
        type: "rule",
        isCut: isCutRule,
        head: parseExp(head, errorAreas),
        begin: rule.begin,
        end: rule.end!,
        body: body?.length ? parseExp(body, errorAreas) : undefined
      })
    } else {
      rule.children[0].errors.push("没有对的规则头")
    }
    return init
  }, [])

  return {
    rules,
    errorAreas
  }
}

//括号优先级最高,然后是冒号、空格、逗号,然后是;
function parseExp(rules: FilterType[], errorAreas: ErrorArea[]): LExp {
  const treeList = parseBracketTree(rules, errorAreas)
  return infixJoin(treeList, errorAreas)
}
/**
 * 假设在一种括号中
 * @param bracket 
 * @param errorAreas 
 * @returns 
 */
function infixJoin(bracket: BracketList, errorAreas: ErrorArea[]): LExp {
  if (!bracket.list.length) {
    if (bracket.bType == '(') {
      errorAreas.push({
        begin: bracket.begin,
        end: bracket.end,
        error: "不允许空的列表"
      })
    }
    return {
      type: "[]",
      begin: bracket.begin,
      end: bracket.end,
    } as LList
  }
  //再用分号区分或语句
  const content = leftJoinExp(
    bracket.list,
    isOrCutExp,
    function (leftExp, rightExp, centerFlag) {
      const orExp: LOrExp = {
        type: "or",
        isCut: centerFlag.value == '|',
        begin: leftExp.begin,
        end: rightExp.end,
        left: leftExp,
        right: rightExp
      }
      return orExp
    }, function (list) {
      return toAndExp(list, errorAreas)!
    })
  if (content) {
    if (bracket.bType == '(') {
      return {
        type: "()",
        begin: bracket.begin,
        end: bracket.end,
        content
      } as LBracket
    } else {
      return {
        type: "[]",
        begin: bracket.begin,
        end: bracket.end,
        content
      } as LList
    }
  }
  //默认走到这里
  console.log("不会走到这里")
  return {
    type: "[]",
    begin: bracket.begin,
    end: bracket.end,
  } as LList
}
function toAndExp(exps: BracketRow[], errorAreas: ErrorArea[]) {
  return leftJoinExp(exps, isAndExp, function (leftExp, rightExp) {
    const andExp: LAndExp = {
      type: "and",
      begin: leftExp.begin,
      end: rightExp.end,
      left: leftExp,
      right: rightExp
    }
    return andExp
  }, function (list) {
    return toPairExp(list, errorAreas)
  })
}
function toPairExp(exps: BracketRow[], errorAreas: ErrorArea[]) {
  const children = exps.map(v => {
    if (v.type == "bracket") {
      return infixJoin(v, errorAreas)
    }
    return v
  })
  if (children.length == 1) {
    return children[0]
  }
  const pairs: LPairs = {
    type: "pairs",
    children,
    begin: children[0].begin,
    end: children.at(-1)?.end!
  }
  return pairs
}

function leftJoinExp(
  list: BracketRow[],
  isSplit: (v: BracketRow) => v is LBlock,
  buildBindExp: (
    leftExp: LExp,
    rightExp: LExp,
    centerFlag: LBlock
  ) => LExp,
  buildInitExp: (list: BracketRow[]) => LExp
) {

  const out = list.reduce<{
    list: {
      exp: LExp
      //后继的split
      split: LBlock
    }[]
    cache: BracketRow[]
  }>(function (init, row) {
    if (isSplit(row)) {
      if (init.cache.length) {
        init.list.push({
          exp: buildInitExp(init.cache),
          split: row
        })
        init.cache.length = 0
      } else {
        row.errors.push("需要有右边内容")
      }
    } else {
      init.cache.push(row)
    }
    return init
  }, {
    list: [],
    cache: []
  })

  let lastExp = out.cache.length ? buildInitExp(out.cache) : out.list.pop()?.exp
  if (lastExp) {
    for (let i = out.list.length - 1; i > -1; i--) {
      const row = out.list[i]
      lastExp = buildBindExp(row.exp, lastExp, row.split)
    }
    return lastExp
  }
}
function rightJoinExp(
  list: BracketRow[],
  isSplit: (v: BracketRow) => v is LBlock,
  buildBindExp: (
    leftExp: LExp,
    rightList: BracketRow[],
    centerFlag: LBlock
  ) => LExp,
  buildInitExp: (list: BracketRow[]) => LExp
) {
  const orOut = list.reduce<{
    leftExp: LExp,
    centerFlag: LBlock,
    rightList: BracketRow[]
  } | {
    leftExp?: never
    centerFlag?: never
    rightList: BracketRow[]
  }>(function (init, row) {
    if (isSplit(row)) {
      if (init.leftExp) {
        //已经有左边的表达式
        if (init.rightList.length) {
          //有前面的列表
          return {
            leftExp: buildBindExp(init.leftExp, init.rightList, init.centerFlag),
            centerFlag: row,
            infix: row.value,
            rightList: []
          }
        } else {
          row.errors.push("需要左边的内容")
        }
      } else {
        //没有左边的内容
        if (init.rightList.length) {
          //将rightList变成第一个leftExp
          return {
            leftExp: buildInitExp(init.rightList),
            infix: row.value,
            centerFlag: row,
            rightList: []
          }
        } else {
          row.errors.push("需要左边的内容")
        }
      }
    } else {
      init.rightList.push(row)
    }
    return init
  }, {
    rightList: []
  })

  let content: LExp | undefined = undefined
  if (orOut.centerFlag) {
    if (orOut.rightList.length) {
      content = buildBindExp(orOut.leftExp, orOut.rightList, orOut.centerFlag)
    } else {
      orOut.centerFlag.errors.push("需要右边的内容")
      content = orOut.leftExp
    }
  } else {
    if (orOut.rightList.length) {
      content = buildInitExp(orOut.rightList)
    } else {
      //没有表达式
      console.log("不会出现这个条件")
    }
  }
  return content
}

function isAndExp(v: BracketRow): v is LBlock {
  return v.type == 'block' && v.value == ','
}
function isOrCutExp(v: BracketRow): v is LBlock {
  return v.type == 'block' && (v.value == ';' || v.value == '|')
}

type BracketRow = BracketList | FilterType
type BracketList = {
  type: "bracket"
  bType: "(" | "["
  from: FilterType
  begin: number
  end: number
  list: BracketRow[]
}

/**
 * 解析成括号的层级
 * @param rules 
 * @param errorAreas 
 * @returns 
 */
function parseBracketTree(rules: FilterType[], errorAreas: ErrorArea[]) {
  const top: BracketList = {
    type: "bracket",
    bType: "(",
    from: null as any,
    begin: rules[0].begin,
    end: rules.at(-1)!.end,
    list: []
  }
  const stacks: BracketList[] = [top]
  let i = 0
  while (i < rules.length) {
    const rule = rules[i]
    if (rule.type == 'block') {
      if (rule.value == '(' || rule.value == '[') {
        const newStack: BracketList = {
          type: "bracket",
          bType: rule.value,
          from: rule,
          begin: rule.begin,
          end: 0,
          list: []
        }
        stacks.at(-1)?.list.push(newStack)
        stacks.push(newStack)
      } else if (rule.value == ')' || rule.value == ']') {
        const pop = stacks.pop()
        if (pop && pop != top) {
          pop.end = rule.end
          if (pop.from.value == '(' && rule.value == ']') {
            rule.errors.push('需要括号),不匹配')
          } else if (pop.from.value == '[' && rule.value == ')') {
            rule.errors.push('需要括号],不匹配')
          }
        } else {
          //过多的括号
          errorAreas.push({
            error: "过多的括号之外的内容",
            begin: rule.begin,
            end: rules.at(-1)?.end!
          })
          return top
        }
      } else {
        stacks.at(-1)?.list.push(rule)
      }
    } else {
      stacks.at(-1)?.list.push(rule)
    }
    i++
  }
  if (stacks.length != 1) {
    //缺少括号
    const last = rules.at(-1)?.end
    for (let x = 1; x < stacks.length; x++) {
      const stack = stacks[x]
      stack.end = last!
      stack.from.errors.push('缺少对应的括号')
    }
  }
  return top
}
function listSplit<T>(list: T[], isSplit: (v: T) => boolean) {
  return listSplitTrans(list, isSplit, quote)
}
function listSplitTrans<T, V>(list: T[], isSplit: (v: T) => boolean, trans: (v: T) => V) {
  return list.reduce<V[][]>(function (init, row) {
    if (isSplit(row)) {
      init.push([])
    } else {
      init.at(-1)?.push(trans(row))
    }
    return init
  }, [[]])
}

function toStringEscape(str: string, quote: string, errors: string[]) {
  const vs: string[] = []
  let i = 0
  while (i < str.length) {
    if (str.startsWith('\\\\', i)) {
      vs.push('\\')
      i = i + 2
    } else if (str.startsWith(`\\${quote}`, i)) {
      vs.push(quote)
      i = i + 2
    } else if (str.startsWith('\\', i)) {
      //错误,不需要转义
      errors.push("不需要转义")
      i++
    } else {
      vs.push(str[i])
      i++
    }
  }
  vs.shift()//第一格
  if (vs.at(-1) == quote) {
    vs.pop()
  }
  return vs.join('')
}