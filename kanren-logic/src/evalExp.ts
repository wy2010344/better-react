import { Goal, KSubsitution, KType, KVar, List, Stream, extendSubsitution, getPairLeft, getPairRight, kanren, streamBindGoal, walk } from "./kanren"
import { LAndExp, LExp, LOrExp, LRule } from "./parse"
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
export function evalLExp(exp: LExp, pool: VarPool): KType {
  if (exp.type == "[]") {
    return exp.children.map(vx => {
      return evalLExp(vx, pool)
    })
  } else if (exp.type == "and") {
    return evalAndOr(exp, pool)
  } else if (exp.type == "or") {
    return evalAndOr(exp, pool)
  } else if (exp.type == "block") {
    return exp.value
  } else if (exp.type == "string") {
    return exp.value
  } else if (exp.type == "var") {
    if (exp.value) {
      const oldV = pool.get(exp.value)
      if (oldV) {
        return oldV
      }
      const newV = kanren.fresh()
      pool.set(exp.value, newV)
      return newV
    }
    //忽略型变量
    return kanren.fresh()
  } else {
    throw `unknown exp type ${exp}`
  }
}
/**
 * and与or,提供出来也是前结合,计算后的结果是后结合
 */
function evalAndOr(exp: LAndExp | LOrExp, pool: VarPool): KType {
  return [
    evalLExp(exp.left, pool),
    exp.type == 'or' ? exp.isCut ? '|' : ';' : ',',
    evalLExp(exp.right, pool)
  ]
}



function toEvalRules(
  sub: KSubsitution,
  rules: List<EvalRule>,
  exp: KType,
  topRules: List<EvalRule>): Stream<KSubsitution> {
  if (rules) {
    const first = getPairLeft(rules)
    const right = getPairRight(rules)
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
      const head = [left, ',', right]
      const out = kanren.toUnify(sub, exp, head)
      if (out) {
        return streamBindGoal(out, function (sub) {
          return kanren.toAnd<KSubsitution>(
            sub,
            topEvalExpGoal(topRules, left),
            topEvalExpGoal(topRules, right)
          )
        })
      }
      return out
    },
  },
  //是否是变量
  {
    query(sub, exp, topRules) {
      const va = kanren.fresh()
      const head = [va, '是变量']
      const out = kanren.toUnify(sub, exp, head)
      if (out) {
        return streamBindGoal(out, function (sub) {
          const val = walk(va, sub)
          if (val instanceof KVar) {
            return kanren.success(sub)
          }
          return null
        })
      }
      return out
    },
  },
  //{a}是{b}
  {
    query(sub, exp) {
      const va = kanren.fresh()
      const vb = kanren.fresh()
      const head = [va, '是', vb]
      const out = kanren.toUnify(sub, exp, head)
      if (out) {
        return streamBindGoal(out, function (sub) {
          return kanren.toUnify(sub, va, vb)
        })
      }
      return out
    }
  },
  //js执行{x}[a,b,c,d]等于{z}
  {
    query(sub, exp, topRules) {
      const method = kanren.fresh()
      const params = kanren.fresh()
      const ret = kanren.fresh()
      const head = ['js执行', method, params, "等于", ret]
      const out = kanren.toUnify(sub, exp, head)
      if (out) {
        return streamBindGoal(out, function (sub) {
          const realMethod = walk(method, sub)
          const realParams = walk(params, sub)
          if (Array.isArray(realParams)) {
            if (typeof realMethod == 'function') {
              try {
                const realRet = (realMethod as any).apply(null, realParams)
                return kanren.success(extendSubsitution(ret, realRet, sub))
              } catch (ex) {
                console.log("出错", ex)
              }
            }
          }
          return null
        })
      }
      return out
    },
  },
  //js-eval{x}等于{y}
  {
    query(sub, exp, topRules) {
      const method = kanren.fresh()
      const val = kanren.fresh()
      const head = ['js-eval', method, '等于', val]
      const out = kanren.toUnify(sub, exp, head)
      if (out) {
        return streamBindGoal(out, function (sub) {
          const realMethod = walk(method, sub)
          if (typeof realMethod == 'string') {
            try {
              const vax = eval(realMethod)
              return kanren.success(extendSubsitution(val, vax, sub))
            } catch (ex) {
              console.log("出错", ex)
            }
          }
          return null
        })
      }
      return null
    },
  },
  {
    /**
     * 来源[a,b,c,d]
     * 目标 [a,[b,[c,d]]]
     * @param sub 
     * @param exp 
     * @param topRules 
     * @returns 
     */
    query(sub, exp, topRules) {
      const from = kanren.fresh()
      const to = kanren.fresh()
      const head = [from, '转为pairs', to]
      const out = kanren.toUnify(sub, exp, head)
      if (out) {
        return streamBindGoal(out, function (sub) {
          const realFrom = walk(from, sub)
          if (Array.isArray(realFrom)) {
            return kanren.success(
              extendSubsitution(to, kanren.toList(realFrom), sub)
            )
          }
          return null
        })
      }
      return null
    },
  },
  {
    /**
     * 来源[a,b,c,d]
     * 目标 [a,[b,[c,d]]]
     * @param sub 
     * @param exp 
     * @param topRules 
     * @returns 
     */
    query(sub, exp, topRules) {
      const from = kanren.fresh()
      const to = kanren.fresh()
      const head = [from, '转为list', to]
      const out = kanren.toUnify(sub, exp, head)
      if (out) {
        return streamBindGoal(out, function (sub) {
          const realFrom = walk(from, sub)
          if (Array.isArray(realFrom)) {
            return kanren.success(
              extendSubsitution(to, kanren.toList(realFrom, true, []), sub)
            )
          }
          return null
        })
      }
      return null
    },
  },
  {
    /**
     * 来源 [a,[b,[c,d]]]
     * 目标 [a,b,c,d]
     * @param sub 
     * @param exp 
     * @param topRules 
     * @returns 
     */
    query(sub, exp, topRules) {
      const from = kanren.fresh()
      const to = kanren.fresh()
      const head = [from, '转回数组', to]
      const out = kanren.toUnify(sub, exp, head)
      if (out) {
        return streamBindGoal(out, function (sub) {
          const realFrom = walk(from, sub)
          const outList: KType[] = []
          circleBack(outList, realFrom)
          return kanren.success(extendSubsitution(to, outList, sub))
        })
      }
      return null
    },
  }
]

function circleBack(list: KType[], data: KType) {
  if (Array.isArray(data) && data.length == 2) {
    list.push(data[0])
    circleBack(list, data[1])
  } else {
    list.push(data)
  }
}

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
  const head = [left, isCut ? '|' : ';', right]
  const out = kanren.toUnify(sub, head, exp)
  if (out) {
    return streamBindGoal(out, function (sub) {
      return (isCut ? kanren.toCut : kanren.toOr)<KSubsitution>(
        sub,
        topEvalExpGoal(topRules, left),
        topEvalExpGoal(topRules, right)
      )
    })
  }
  return out
}

function topEvalExpGoal(
  topRules: List<EvalRule>,
  exp: KType
): Goal<KSubsitution> {
  return function (sub) {
    const log = stringifyLog(walk(exp, sub))
    return toEvalExp(sub, topRules, exp)
  }
}