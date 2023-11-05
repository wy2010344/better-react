import { KPair, KType, List, KSymbol, kanren, toList, toPairs } from "./kanren"
import { BaseQue, ParseFunGet, QueArray, andRuleGet, manyRuleGet, matchEnd, matchVS, orRuleGet, ruleGet, ruleGetSelf } from "./tokenParser"
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
type FilterType = LString | LBlock | LVar
/**
 * 有明显的括号,或叶子节点
 * [a b c]
 * [a b c | d]
 */
export type LList = {
  type: "[]"
  begin: number
  end: number
  children: AtomExp[]
  last?: AtomExp
  errors: string[]
}
/**
 * (a b c)
 */
export type LTerm = {
  type: '()'
  begin: number
  end: number
  children: AtomExp[]
  errors: string[]
}
/**叶子节点的原子 */
export type AtomExp = LList | LTerm | FilterType

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

const ruleGetString = ruleGetSelf(function (v: FilterType) {
  return v.type == 'string'
})
const ruleGetVar = ruleGetSelf(function (v: FilterType) {
  return v.type == 'var'
})

const ruleGetEnd = ruleGet(matchEnd, function (begin, end) {
  return end.content[end.i - 1]
})

/**
 * 在小括号内,不能是结束括号
 */
const ruleGetAll = orRuleGet(
  function (que) {
    return termRule(que)
  },
  function (que) {
    return listRule(que)
  },
  ruleGetString,
  ruleGetVar,
  ruleGetSelf(function (v: FilterType) {
    return v.type == 'block' && v.value != ')'
  }),
)

/**
 * 在中括号内的,不能是结束符号
 */
const ruleGetAllNotSplit = orRuleGet(
  function (que) {
    return termRule(que)
  },
  function (que) {
    return listRule(que)
  },
  ruleGetString,
  ruleGetVar,
  ruleGetSelf(function (v: FilterType) {
    return v.type == 'block' && v.value != '|' && v.value != ']'
  }),
)

function isLastTermBlock(v: FilterType) {
  return v.type == 'block' && v.value == ')'
}
const queryRuleGet = manyRuleGet(ruleGetAll)

const termRule: ParseFunGet<BaseQue<FilterType, QueArray<FilterType>>, LTerm> = andRuleGet(
  [
    ruleGetSelf(function (v: FilterType) {
      return v.type == 'block' && v.value == '('
    }),
    queryRuleGet,
    orRuleGet(
      ruleGetSelf(isLastTermBlock),
      ruleGetEnd
    )
  ],
  function (a, vs, b) {
    let end = b.end
    const errors: string[] = []
    if (!isLastTermBlock(b)) {
      errors.push("缺少对应的括号)")
    }
    return {
      type: "()",
      begin: a.begin,
      end,
      children: vs,
      errors
    }
  }
)

function isLastListBlock(v: FilterType) {
  return v.type == 'block' && v.value == ']'
}
const listEndRule: ParseFunGet<BaseQue<FilterType, QueArray<FilterType>>, FilterType> = orRuleGet(
  ruleGetSelf(isLastListBlock),
  ruleGetEnd
)

const listRule: ParseFunGet<BaseQue<FilterType, QueArray<FilterType>>, LList> = andRuleGet(
  [
    ruleGetSelf(function (v) {
      return v.type == 'block' && v.value == '['
    }),
    manyRuleGet(ruleGetAllNotSplit),
    orRuleGet(
      andRuleGet(
        [
          ruleGetSelf(function (v) {
            return v.type == 'block' && v.value == '|'
          }),
          ruleGetAllNotSplit,
          listEndRule
        ],
        function (split, last, end) {
          return {
            type: "last",
            split,
            last,
            end
          }
        }
      ) as ParseFunGet<BaseQue<FilterType, QueArray<FilterType>>, {
        type: "last",
        split: FilterType
        last: AtomExp,
        end: FilterType
      }>,
      listEndRule
    )
  ],
  function (a, b, c) {
    let last = undefined
    const errors: string[] = []
    let end = 0
    if (c.type == 'last') {
      end = c.end.end
      if (!isLastListBlock(c.end)) {
        errors.push("缺少对应的括号]")
      }
      last = c.last
    } else {
      end = c.end
      if (!isLastListBlock(c)) {
        errors.push("缺少对应的括号]")
      }
    }
    return {
      type: "[]",
      begin: a.begin,
      end,
      children: b,
      last,
      errors
    }
  }
)
const topRuleGet = manyRuleGet(termRule)


export type LRule = {
  type: "rule"
  begin: number
  end: number
  head: CacheValue
  body?: CacheValue
  isCut?: boolean
}
function mergeErrorAreas(item: AtomExp, errorAreas: ErrorArea[]) {

}


type PureCacheValue = {
  type: "value",
  value: any
} | {
  type: "var"
  value: string
} | null
export type CacheValue = KPair<CacheValue, CacheValue> | PureCacheValue

function evalToTerm(children: AtomExp[]): CacheValue {
  const list = toList(children.map(evalToExp))
  return KPair.of(KPair.of(
    {
      type: "value",
      value: children.length
    },
    {
      type: "value",
      value: KSymbol.term
    }
  ), list)
}


function evalToExp(v: AtomExp): CacheValue {
  if (v.type == '()') {
    //函子
    return evalToTerm(v.children)
  } else if (v.type == '[]') {
    let last = v.last ? evalToExp(v.last) : null
    return toPairs(v.children.map(evalToExp), last)
  } else if (v.type == 'block') {
    const ev = v.value
    if (ev.startsWith("$")) {
      //特殊定义
      if (ev == '$nil') {
        return {
          type: "value",
          value: null
        }
      } else if (ev == '$term') {
        return {
          type: "value",
          value: KSymbol.term
        }
      } else if (ev == '$nat') {
        return {
          type: "value",
          value: KSymbol.nat
        }
      } else {
        throw `未知特殊符号${ev}`
      }
    } else {
      const nx = Number(ev)
      if (!isNaN(nx)) {
        return {
          type: "value",
          value: nx
        }
      }
      return {
        type: "value",
        value: ev
      }
    }
  } else if (v.type == 'string') {
    return {
      type: "value",
      value: v.value
    }
  } else {
    return {
      type: "var",
      value: v.value
    }
  }
}



const ruleGetEndNull = ruleGet(matchEnd, function (begin, end) {
  return null
})
const ruleRuleGet: ParseFunGet<BaseQue<AtomExp, QueArray<AtomExp>>, LRule> = andRuleGet(
  [
    ruleGetSelf(function (v: AtomExp) {
      return v.type == '()'
    }),
    orRuleGet(
      ruleGetSelf(function (v: AtomExp) {
        return v.type == '()'
      }),
      ruleGetEndNull
    ),
    orRuleGet(
      ruleGetSelf(function (v: AtomExp) {
        return v.type == 'block' && v.value == '!'
      }),
      ruleGetEndNull
    )
  ],
  function (a, b, c) {
    return {
      type: "rule",
      begin: a.begin,
      end: c ? c.end : b ? b.end : a.end,
      head: evalToExp(a),
      body: b ? evalToExp(b) : undefined,
      isCut: !!c,
    }
  }
)

export function parseRules(tokens: LToken[]) {
  const errorAreas: ErrorArea[] = []
  /**
   * a b [daf ds ] (d aew aw)
   */
  const filterTokens = getFilterTokens(tokens)
  const result = topRuleGet(new BaseQue(filterTokens))
  const rules: LRule[] = []
  let asts: LTerm[] = []
  if (result) {
    asts = result.value
    for (const row of result.value) {
      mergeErrorAreas(row, errorAreas)
      const cs = row.children
      const out = ruleRuleGet(new BaseQue(cs))
      if (out) {
        rules.push(out.value)
      } else {
        errorAreas.push({
          begin: row.begin,
          end: row.end,
          error: "不是合法的规则"
        })
      }
    }
  }
  return {
    asts,
    rules,
    errorAreas
  }
}

export function parseQuery(tokens: LToken[]) {
  const errorAreas: ErrorArea[] = []
  const filterTokens = getFilterTokens(tokens)
  const result = queryRuleGet(new BaseQue(filterTokens))

  let asts: AtomExp[] = []
  let query: CacheValue = null
  if (result) {
    asts = result.value
    for (const cell of result.value) {
      mergeErrorAreas(cell, errorAreas)
    }
    query = evalToTerm(result.value)
  }
  return {
    asts,
    query,
    errorAreas
  }
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