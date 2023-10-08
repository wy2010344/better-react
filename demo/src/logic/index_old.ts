import { domOf, useDom } from "better-react-dom";
import { normalPanel } from "../panel/PanelContext";
import { AGoal, APair, AStream, AVar, streamAppendStream, streamBindGoal, unify, walk } from "./kanren_old";

export default normalPanel(function (operate, id) {

  console.log(list(1, 2, 3, 4, 5))
  domOf("div", {

  }).render()
})

function pair(left: any, right: any) {
  return {
    type: pair,
    left,
    right
  }
}
function append(before: any, after: any, total: any) {
  return {
    type: append,
    before,
    after,
    total
  }
}
function term(head: any, body?: any) {
  return {
    type: term,
    head, body
  }
}
let globalMap: Map<String, AVar> | undefined = undefined
// function V(ts: TemplateStringsArray) {
//   const key = ts.join('').trim()
//   if (globalMap) {
//     let oldVar = globalMap.get(key)
//     if (!oldVar) {
//       oldVar = new AVar(key)
//       globalMap.set(key, oldVar)
//     }
//     return oldVar
//   } else {
//     throw new Error(`必须在规则的执行中`)
//   }
// }

/**
 * 用字符串模块来简化书写
 * 用Proxy来简化书写
 * 用pipline的中缀法来简化书写(pipline限定的是可以组合的可能性)
 * 用函数调用来构造复杂对象(基础)
 * 都是简化书写的方式.
 * 还有可能就是重载操作符——复用操作符号的中缀
 */
const V = new Proxy<{
  [key: string]: AVar
}>({}, {
  get(a, key: string) {
    if (globalMap) {
      let oldVar = globalMap.get(key)
      if (!oldVar) {
        oldVar = new AVar(key)
        globalMap.set(key, oldVar)
      }
      return oldVar
    } else {
      throw new Error(`必须在规则的执行中`)
    }
  }
})
function mergeRule<T>(fun: () => T) {
  const map = new Map<string, AVar>()
  globalMap = map
  const out = fun()
  globalMap = undefined
  return [out, map] as const
}
function list(...vs: any[]) {
  let p = null
  for (let i = vs.length - 1; i > -1; i--) {
    const row = vs[i]
    p = pair(row, p)
  }
  return p
}

const scope = list(
  () => term(
    append(list(), V.B, V.B)
  ),
  () => term(
    append(pair(V.X, V.Y), V.B, pair(V.X, V.F)),
    append(V.Y, V.B, V.F)
  )
)
function logList(list: any) {
  const vs = []
  while (list) {
    vs.push(list.left)
    list = list.right
  }
  console.log(vs)
}

type Rule = () => {
  head: any,
  body: any
}


function runInScope(baseScope: ReturnType<typeof list>, term: () => any) {
  const [toFind, map] = mergeRule(term)

  /**
   * 
   * @param tryBody 待查询的表达式
   * @param sub 之前合一成功的作用域
   * @param getStream
   * @returns 
   */
  function findBody(tryBody: any, sub: any, getStream: (v: AStream<any>) => AStream<any>): AStream<any> {
    if (tryBody.type == or) {
      //追加可能性
      const leftStream = findBody(tryBody.left, sub, getStream)
      return streamAppendStream(leftStream, function () {
        return findBody(tryBody.right, sub, getStream)
      })
    } else if (tryBody.type == and) {
      //在所有世界线下叠加
      const leftStream = findBody(tryBody.left, sub, getStream)
      return streamBindGoal(leftStream, (sub) => {
        return findBody(tryBody.right, sub, getStream)
      })
    }
    // const bodyTerm = walk(tryLeft.body, sub)
    // const stream = findTerm(baseScope, bodyTerm, sub)
    //这里是递归的查询结果,需要进行作用域合并.
    const stream = findTerm(baseScope, tryBody, sub)
    return getStream(stream)
  }

  /**
   * 
   * @param scope 供搜索的库、作用域
   * @param term 具体表达式,非and与or的叶子表达式
   * @param outSub 之前的作用域,比如head合一成功后的新作用域
   * @returns 
   */
  function findTerm(scope: ReturnType<typeof list>, term: any, outSub: any): AStream<any> {
    while (scope) {
      const func = scope.left
      const [tryFun] = mergeRule(func) as any
      const out = unify(term, tryFun.head, outSub)
      if (out[0]) {
        const sub = out[1]
        const right = scope.right
        if (tryFun.body) {
          const tryBody = tryFun.body
          return findBody(tryBody, sub, (stream) => {
            return streamAppendStream(stream, () => {
              return findTerm(right, term, outSub)
            })
          })
          //从顶层开始找
        } else {
          return APair.of(sub, () => {
            return findTerm(right, term, outSub)
          })
        }
      }
      scope = scope.right
    }
    return null
  }
  let stream = findBody(toFind, null, v => v)
  while (stream) {
    const left = stream.getLeft()
    //logStream(left)
    const newMap = {} as any
    map.forEach(function (value, k) {
      newMap[k] = walk(value, left)
    })
    console.log("---", newMap)
    stream = stream.getRight()()
  }
}


function logStream(list: any) {
  const a = new Map()
  while (list) {
    const left = list.getLeft()
    a.set(left.left, left.right)
    list = list.getRight()
  }
  console.log(a)
}
// const out = runInScope(scope, () => append(V.X, V.Y, list(1, 2, 3, 4, 5)))

// const out = runInScope(scope, () => and(
//   append(V.X, V.Y, list(1, 2, 3, 4, 5)),
//   append(V.Y, V.F, list(4, 5, 6, 7))
// ))


function and(left: any, right: any) {
  return {
    type: and,
    left,
    right
  }
}

function or(left: any, right: any) {
  return {
    type: or,
    left,
    right
  }
}