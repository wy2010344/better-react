import { LToken } from "./tokenize"

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
 * 有明显的括号,或叶子节点
 * [a b c]
 * []
 */
export type LList = {
  type: "[]"
  begin: number
  end: number
  children: AtomExp[]
}

type FilterType = LString | LBlock | LVar
/**叶子节点的原子 */
export type AtomExp = LList | FilterType
/**表达式 */
export type LExp = LAndExp | LOrExp | AtomExp
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
  head: LList,
  begin: number
  end: number
  body?: LAndExp | LOrExp | LList
}

export type ErrorArea = {
  error: string
  begin: number
  end: number
}

function getFilterTokens(tokens: LToken[]) {
  return tokens.reduce<FilterType[]>((init, v, i) => {
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
}

export function parseRules(tokens: LToken[]) {
  const errorAreas: ErrorArea[] = []

  const filterTokens = getFilterTokens(tokens)
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
      const headExp = parseExp(head, errorAreas)
      if (headExp && headExp.type == '[]') {
        init.push({
          type: "rule",
          isCut: isCutRule,
          head: headExp,
          begin: rule.begin,
          end: rule.end!,
          body: body?.length ? parseExp(body, errorAreas) : undefined
        })
      } else {
        rule.children[0].errors.push("无法正确地解析规则头")
      }
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

export function parseQuery(tokens: LToken[]) {
  const errorAreas: ErrorArea[] = []
  const filterTokens = getFilterTokens(tokens)
  const last = filterTokens.at(-1)
  if (last?.type == 'block' && last.value == '.') {
    filterTokens.pop()
  }
  return {
    query: parseExp(filterTokens, errorAreas),
    errorAreas
  }
}
//括号优先级最高,然后是冒号、空格、逗号,然后是;
function parseExp(rules: FilterType[], errorAreas: ErrorArea[]) {
  const treeList = parseBracketTree(rules, errorAreas)
  return infixJoinNoBracket(treeList, errorAreas)
}

/**
 * 作为or-exp来解析
 * @param bracket 
 * @param errorAreas 
 * @returns 
 */
function infixJoinNoBracket(bracket: BracketList, errorAreas: ErrorArea[]): LOrExp | LAndExp | LList | undefined {
  //再用分号区分或语句
  return leftJoinExp<LOrExp, LOrExp | LAndExp | LList>(
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
}
function toAndExp(exps: BracketRow[], errorAreas: ErrorArea[]) {
  return leftJoinExp<LAndExp, LList | LAndExp | LOrExp>(exps, isAndExp, function (leftExp, rightExp) {
    const andExp: LAndExp = {
      type: "and",
      begin: leftExp.begin,
      end: rightExp.end,
      left: leftExp,
      right: rightExp
    }
    return andExp
  }, function (list) {
    if (list.length == 1) {
      const first = list[0]
      if (first.type == "bracket" && first.bType == '(') {
        //优先级
        const centerExp = infixJoinNoBracket(first, errorAreas)
        if (centerExp?.type != 'and' && centerExp?.type != 'or') {
          errorAreas.push({
            begin: first.begin,
            end: first.end,
            error: "小括号中间必须是and或or表达式"
          })
        } else {
          centerExp.begin = first.begin
          centerExp.end = first.end
        }
        return centerExp || {
          type: "[]",
          begin: first.begin,
          end: first.end,
          children: []
        }
      }
    }
    return toListExp(list, errorAreas)
  })
}

function toListExp(exps: BracketRow[], errorAreas: ErrorArea[]): LList {
  const children = exps.map(v => {
    if (v.type == "bracket") {
      if (v.bType == '(') {
        errorAreas.push({
          begin: v.begin,
          end: v.end,
          error: "中括号里不允许小括号"
        })
      }
      const outExp = toListExp(v.list, errorAreas)
      outExp.begin = v.begin
      outExp.end = v.end
      return outExp
    }
    return v
  })
  const pairs: LList = {
    type: "[]",
    children,
    begin: children[0]?.begin,
    end: children.at(-1)?.end!
  }
  return pairs
}

function leftJoinExp<A, B>(
  list: BracketRow[],
  isSplit: (v: BracketRow) => v is LBlock,
  buildBindExp: (
    leftExp: B,
    rightExp: B | A,
    centerFlag: LBlock
  ) => A,
  buildInitExp: (list: BracketRow[]) => B
) {

  const out = list.reduce<{
    list: {
      exp: B
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

  let lastExp: A | B | undefined = out.cache.length ? buildInitExp(out.cache) : out.list.pop()?.exp
  if (lastExp) {
    for (let i = out.list.length - 1; i > -1; i--) {
      const row = out.list[i]
      lastExp = buildBindExp(row.exp, lastExp, row.split)
    }
    return lastExp
  }
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
    bType: "[",
    from: null as any,
    begin: rules[0]?.begin,
    end: rules.at(-1)?.end!,
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