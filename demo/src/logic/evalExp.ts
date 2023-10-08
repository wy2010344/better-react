import { Goal, KSubsitution, KType, KVar, List, Pair, Stream, kanren, walk } from "./kanren"
import { LAndExp, LExp, LOrExp, LPairs, LRule } from "./parse"
import { stringifyLog } from "./stringify"



export class VarPool {
  private pool: { [key in string]: KVar } = {}
  get(key: string) {
    return this.pool[key]
  }
  set(key: string, value: KVar) {
    this.pool[key] = value
  }
  forEach(callback: (value: KVar, key: string) => void) {
    for (const key in this.pool) {
      callback(this.pool[key], key)
    }
  }
  entries() {
    return Object.entries(this.pool)
  }
}
export function evalLExp(exp: LExp, pool: VarPool, pairAsList?: boolean): KType {
  if (exp.type == "()") {
    return evalLExp(exp.content, pool)
  } else if (exp.type == "[]") {
    if (exp.content) {
      return evalLExp(exp.content, pool, true)
    }
    return null
  } else if (exp.type == "and") {
    return evalAndOr(exp, pool)
  } else if (exp.type == "or") {
    return evalAndOr(exp, pool)
  } else if (exp.type == "block") {
    return exp.value
  } else if (exp.type == "pairs") {
    //这里变量注入的顺序是反的
    return kanren.toListTrans(exp.children, v => evalLExp(v, pool), pairAsList)
  } else if (exp.type == "string") {
    return exp.value
  } else if (exp.type == "var") {
    const oldV = pool.get(exp.value)
    if (oldV) {
      return oldV
    }
    const newV = kanren.fresh()
    pool.set(exp.value, newV)
    return newV
  } else {
    throw `unknown exp type ${exp}`
  }
}
/**
 * and与or,提供出来也是前结合,计算后的结果是后结合
 */
function evalAndOr(exp: LAndExp | LOrExp, pool: VarPool): KType {
  return kanren.toList([
    evalLExp(exp.left, pool),
    exp.type == 'or' ? exp.isCut ? '|' : ';' : ',',
    evalLExp(exp.right, pool)
  ])
}



function toEvalRules(
  sub: KSubsitution,
  rules: List<EvalRule>,
  exp: KType,
  topRules: List<EvalRule>): Stream<KSubsitution> {
  if (rules) {
    const first = rules.left
    const right = rules.right
    return (first.isCut ? kanren.toCut : kanren.toOr)<KSubsitution>(sub, function (sub) {
      return first.query(sub, exp, topRules)
    }, function (sub) {
      return toEvalRules(sub, right, exp, topRules)
    })
  }
  return kanren.fail(sub)
}

type EvalRule = {
  isCut?: boolean
  query(sub: KSubsitution, exp: KType, topRules: List<EvalRule>): Stream<KSubsitution>
}

/**
 * 用户自定义的rule
 * @param rule 
 * @returns 
 */
function toCustomRule(rule: LRule): EvalRule {
  return {
    isCut: rule.isCut,
    query(sub: KSubsitution, exp: KType, topRules: List<EvalRule>) {
      const pool = new VarPool()
      function unifyHead(sub: KSubsitution) {
        const head = evalLExp(rule.head, pool)
        return kanren.toUnify(sub, exp, head)
      }
      console.log("topE-custom", exp)
      if (rule.body) {
        return kanren.toAnd<KSubsitution>(sub, unifyHead, function (sub) {
          const body = evalLExp(rule.body!, pool)
          return toEvalExp(sub, topRules, body)
        })
      }
      // return unifyHead(sub)
      return kanren.toAnd<KSubsitution>(sub, unifyHead, kanren.success)
    }
  }
}

export function queryResult(rules: LRule[], exp: KType) {
  return toEvalExp(null, kanren.toAnyList([
    ...defineRules,
    ...rules.map(rule => {
      return toCustomRule(rule)
    })
  ]), exp)
}


const defineRules: EvalRule[] = [
  //orRule
  {
    query(sub, exp, topRules) {
      return toOrExp(sub, topRules, exp)
    },
  },
  //cutRule
  {
    query(sub, exp, topRules) {
      return toOrExp(sub, topRules, exp, true)
    },
  },
  //andRule
  {
    query(sub, exp, topRules) {
      const left = kanren.fresh()
      const right = kanren.fresh()
      const head = kanren.toList([left, ',', right])
      return kanren.toAnd<KSubsitution>(sub, function (sub) {
        return kanren.toUnify(sub, exp, head)
      }, function (sub) {
        console.log("and", stringifyLog(walk(left, sub)), stringifyLog(walk(right, sub)))
        return kanren.toAnd<KSubsitution>(
          sub,
          topEvalExpGoal(topRules, left),
          topEvalExpGoal(topRules, right)
        )
      })
    },
  },
  {
    query(sub, exp, topRules) {
      const display = kanren.fresh()
      const head = kanren.toList(['write', display])
      const out = kanren.toUnify(sub, exp, head)
      if (out) {
        console.log("write", stringifyLog(walk(display, out.left)), stringifyLog(walk(exp, sub)))
      }
      return out
      // return kanren.toAnd<KSubsitution>(sub, function (sub) {
      //   return 
      // }, function (sub) {
      //   const value = walk(display, sub)
      //   console.log('write', value)
      //   return kanren.success(sub)
      // })
    },
  }
]

function toEvalExp(
  sub: KSubsitution,
  topRules: List<EvalRule>,
  exp: KType
): Stream<KSubsitution> {
  return toEvalRules(sub, topRules, exp, topRules)
}

function toOrExp(
  sub: KSubsitution,
  topRules: List<EvalRule>,
  exp: KType,
  isCut?: boolean
) {
  const left = kanren.fresh()
  const right = kanren.fresh()
  const head = kanren.toList([left, isCut ? '|' : ';', right])
  return kanren.toAnd<KSubsitution>(sub, function (sub) {
    return kanren.toUnify(sub, head, exp)
  }, function (sub) {
    console.log("m-or", stringifyLog(walk(exp, sub)))
    return (isCut ? kanren.toCut : kanren.toOr)<KSubsitution>(
      sub,
      topEvalExpGoal(topRules, left),
      topEvalExpGoal(topRules, right)
    )
  })
}

function topEvalExpGoal(
  topRules: List<EvalRule>,
  exp: KType
): Goal<KSubsitution> {
  return function (sub) {
    const log = stringifyLog(walk(exp, sub))
    console.log("topE", exp, log)
    return toEvalExp(sub, topRules, exp)
  }
}