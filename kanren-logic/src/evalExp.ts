import { Goal, KPair, KSubsitution, KType, KVar, List, Stream, KSymbol, extendSubsitution, kanren, streamBindGoal, toList, walk } from "./kanren"
import { CacheValue, LRule } from "./parse"
import { stringifyLog, tryParsePair } from "./stringify"



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
export function evalLExp(exp: CacheValue, pool: VarPool): KType {
  if (exp) {
    if (exp instanceof KPair) {
      return KPair.of(
        evalLExp(exp.left, pool),
        evalLExp(exp.right, pool)
      )
    } else {
      if (exp.type == 'value') {
        //值
        return exp.value
      } else {
        //变量
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
      }
    }
  }
  return exp
}

export function evalAbsExp(exp: KType, pool: VarPool): KType {
  if (exp instanceof KPair) {
    return KPair.of(
      evalAbsExp(exp.left, pool),
      evalAbsExp(exp.right, pool)
    )
  } else if (exp instanceof KVar) {
    const oldV = pool.get(exp.flag)
    if (oldV) {
      return oldV
    }
    const newV = kanren.fresh()
    pool.set(exp.flag, newV)
    return newV
  }
  return exp
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

export type EvalRule = {
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

export function transLateRule(rules: LRule[]) {
  return toList([
    ...defineRules,
    ...rules.map(rule => {
      return toCustomRule(rule)
    })
  ])
}
export function queryResult(allRule: List<EvalRule>, exp: KType) {
  return toEvalExp(null, allRule, exp)
}


function circleMatch(real: KType, sub: KSubsitution, topRules: List<EvalRule>, val: KType): Stream<KSubsitution> {
  if (real instanceof KPair) {
    const first = real.left
    if (first instanceof KPair) {
      const out = tryParsePair(first)
      if (out.type == 'term' && out.list.length == 3) {
        //可以允许少于3,跟rule一样
        const center = out.list[1]
        const match = center == ';' ? kanren.toOr : center == '|' ? kanren.toCut : undefined
        if (match) {
          return match(sub, function (sub) {
            const pool = new VarPool()
            return kanren.toAnd(sub, function (sub) {
              const left = evalAbsExp(out.list[0], pool)
              return kanren.toUnify(sub, val, left)
            }, function (sub) {
              const right = evalAbsExp(out.list[2], pool)
              return toEvalExp(sub, topRules, right)
            })
          }, function (sub) {
            return circleMatch(real.right, sub, topRules, val)
          })
        }
      }
    }
  }
  return null
}
function termToPairs<T>(list: T[]) {
  return KPair.of(
    KPair.of(
      list.length,
      KSymbol.term
    ),
    toList(list)
  )
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
      const head = termToPairs([left, ',', right])
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
  //在全局中执行
  {
    query(sub, exp, topRules) {
      const val = kanren.fresh()
      const head = termToPairs(['apply', val])
      const out = kanren.toUnify(sub, exp, head)
      if (out) {
        return streamBindGoal(out, function (sub) {
          // const realVal = walk(val, sub)
          // console.log("real-val", stringifyLog(realVal), realVal)
          return toEvalExp(sub, topRules, val)
        })
      }
      return out
    },
  },
  /**
   * 作为lambda执行
   * (({x}{y})
   *  ({x}+9={y}))分为左右两部分,
   * 匹配了左边部分,去and右边
   * 左边包括入参与返回值,右边则是仍然去全局匹配规则
   * 可以更抽象,如变成and/or/not
   * ({x}{y},{x}+9={y}...)
   * 仍然能去优先级
   * 后面是函数体,只能以逗号开头
   * 或者多条匹配语句,用---分割,像顶层一样
   * 就变成lambda规则,当然是最后才生成.
   * 但如果跟顶层规则一样,是否导致内部自路由?所以模块化,模块内部调用自身的方法,还是调用到宿主的方法?
   * 其实是类似object,不能自调用/访问
   * 因此是列表的
   * [
   *  a b c
   *  ;fa aweffea
   *  ---
   *  b c d
   *  |fawe awew w
   * ]
   */
  {
    query(sub, exp, topRules) {
      const lambda = kanren.fresh()
      const val = kanren.fresh()
      const head = termToPairs([lambda, 'apply', val])
      const out = kanren.toUnify(sub, exp, head)
      if (out) {
        return streamBindGoal(out, function (sub) {
          const realLambda = walk(lambda, sub)
          return circleMatch(realLambda, sub, topRules, val)
        })
      }
      return out
    },
  },
  //是否是变量
  {
    query(sub, exp, topRules) {
      const va = kanren.fresh()
      const head = termToPairs([va, '是变量'])
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
      const head = termToPairs([va, '是', vb])
      const out = kanren.toUnify(sub, exp, head)
      if (out) {
        return streamBindGoal(out, function (sub) {
          return kanren.toUnify(sub, va, vb)
        })
      }
      return out
    }
  },
  /**
   * js执行{x}(a b c d)等于{z}
   * 这里如何不引入js的各种类型,{x}应该是字符串,则是eval函数
   */
  {
    query(sub, exp, topRules) {
      const method = kanren.fresh()
      const params = kanren.fresh()
      const ret = kanren.fresh()
      const head = termToPairs(['js执行', method, params, "等于", ret])
      const out = kanren.toUnify(sub, exp, head)
      if (out) {
        return streamBindGoal(out, function (sub) {
          const realMethod = walk(method, sub)
          const realParams = walk(params, sub)
          const realRet = walk(ret, sub)
          if (realParams instanceof KPair) {
            const out = tryParsePair(realParams)
            if (out.type == 'term') {
              if (typeof realMethod == 'function') {
                try {
                  const theRet = (realMethod as any).apply(null, out.list)
                  if (realRet instanceof KVar) {
                    return kanren.success(extendSubsitution(realRet, theRet, sub))
                  } else if (realRet == theRet) {
                    return kanren.success(sub)
                  }
                } catch (ex) {
                  console.log("出错", ex)
                }
              }
            }
          }
          return null
        })
      }
      return out
    },
  },
  /**
   * js-eval{x}等于{y}
   * x是数组或字符串
   */
  {
    query(sub, exp, topRules) {
      const method = kanren.fresh()
      const val = kanren.fresh()
      const head = termToPairs(['js-eval', method, '等于', val])
      const out = kanren.toUnify(sub, exp, head)
      if (out) {
        return streamBindGoal(out, function (sub) {
          const realMethod = walk(method, sub)
          const realVal = walk(val, sub)
          if (typeof realMethod == 'string') {
            try {
              const vax = eval(realMethod)
              if (realVal instanceof KVar) {
                return kanren.success(extendSubsitution(realVal, vax, sub))
              } else if (realVal == vax) {
                return kanren.success(sub)
              }
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
    //promise then
    query(sub, exp, topRules) {
      const promiseVar = kanren.fresh()
      const varVal = kanren.fresh()
      const callbackVar = kanren.fresh()
      const head = termToPairs([promiseVar, 'then', varVal, callbackVar])
      const out = kanren.toUnify(sub, exp, head)
      if (out) {
        return streamBindGoal(out, function (sub) {
          const realPromise = walk(promiseVar, sub)
          const reallCallback = walk(callbackVar, sub)
          const realVar = walk(varVal, sub)
          if (realPromise instanceof Promise) {
            realPromise.then(function (key) {
              // console.log("ddd", realVar, key)
              if (realVar instanceof KVar) {
                const newSub = extendSubsitution(realVar, key, sub)
                toEvalExp(newSub, topRules, reallCallback)
              } else if (realVar == key) {
                toEvalExp(sub, topRules, reallCallback)
              }
            })
            return kanren.success(sub)
          }
          return null
        })
      }
      return out
    },
  },
  {
    query(sub, exp) {
      const val = kanren.fresh()
      const head = termToPairs(['log', val])
      const out = kanren.toUnify(sub, exp, head)
      if (out) {
        return streamBindGoal(out, function (sub) {
          const realVal = walk(val, sub)
          console.log(stringifyLog(realVal))
          return kanren.success(sub)
        })
      }
      return out
    }
  },
  {
    /**
     * 数组结合成字符串
     * @param sub 
     * @param exp 
     * @param topRules 
     * @returns 
     */
    query(sub, exp, topRules) {
      const from = kanren.fresh()
      const split = kanren.fresh()
      const to = kanren.fresh()
      const head = termToPairs(['列表', from, '结合', split, '成功', to])
      const out = kanren.toUnify(sub, exp, head)
      if (out) {
        return streamBindGoal(out, function (sub) {
          const realFrom = walk(from, sub)
          if (realFrom instanceof KPair) {
            const out = tryParsePair(realFrom)
            if (out.type == 'term' && out.list.every(v => typeof v == 'string')) {
              const realSplit = walk(split, sub)
              if (typeof realSplit == 'string') {
                const realTo = walk(to, sub)
                const joinStr = out.list.join(realSplit)
                if (realTo instanceof KVar) {
                  return kanren.success(extendSubsitution(realTo, joinStr, sub))
                } else if (realTo == joinStr) {
                  return kanren.success(sub)
                }
              }
            }
          }
          return null
        })
      }
      return null
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
  const head = termToPairs([left, isCut ? '|' : ';', right])
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
    // const log = stringifyLog(walk(exp, sub))
    return toEvalExp(sub, topRules, exp)
  }
}