import { quote } from "better-react"


type Pair<L, R> = [L, R]
export function getPairLeft<L, R>(a: Pair<L, R>) {
  return a[0]
}
export function getPairRight<L, R>(a: Pair<L, R>) {
  return a[1]
}
function pairOf<L, R>(l: L, r: R): Pair<L, R> {
  return [l, r]
}
/**
 * 平行可能行->所有作用域
 * 不同的世界线。没有，或有一个，但后继是空。
 * 是一种或匹配关系
 */
export type DelayStream<V> = () => Stream<V>
export type Stream<V> = null | Pair<V, DelayStream<V>>
export const emptyDelayStream: DelayStream<any> = () => null
/**
 * 增加世界线b
 * 在a流查找后（包括a的所有后继），在b的流继续查找
 * @param a 
 * @param b 
 */
export function streamAppendStream<V>(a: Stream<V>, b: DelayStream<V>): Stream<V> {
  if (a == null) {
    return b()
  } else {
    //如果a有后继，追加到后继之后
    return pairOf(getPairLeft(a), function () {
      return streamAppendStream(getPairRight(a)(), b)
    })
  }
}
/**
 * 求解目标，代入作用域在不同世界线上求解。
 * 作用域在同一世界线上是叠加的。
 */
export type Goal<V> = (sub: V) => Stream<V>
/**
 * 为所有的世界线应用一个条件，变换成新的世界线列表
 * 在a流中，使用b目标查找，每一个节点的尝试
 * 用于and语句。
 * @param a 
 * @param b 
 */
export function streamBindGoal<V>(a: Stream<V>, b: Goal<V>): Stream<V> {
  if (a == null) {
    return null
  } else {
    //如果a有后继流，则递归处理
    return streamAppendStream(b(getPairLeft(a)), function () {
      return streamBindGoal(getPairRight(a)(), b)
    })
  }
}
export class KVar {
  static UID = 0
  constructor(public readonly flag: string = `_${KVar.UID++}`) { }
  toString() {
    return `{${this.flag}}`
  }
  equals(v: any) {
    return v == this || (v instanceof KVar && v.flag == this.flag)
  }
}
/**所有类型 */
export type KType = KVar | string | null | KType[]
export type List<T> = [T, List<T>] | null
type KVPair = Pair<KVar, KType>
/**
 * 作用域链表,key为KVar,value变具体类型,或仍为KVar
 */
export type KSubsitution = List<KVPair>
/**
 * 在作用域中寻找变量的定义
 * @param v 变量
 * @param sub 作用域
 */
export function findVarDefine(v: KVar, sub: KSubsitution): KVPair | null {
  while (sub != null) {
    const kv = getPairLeft(sub)
    const theV = getPairLeft(kv)
    if (theV == v || v.equals(theV)) {
      return kv
    }
    sub = getPairRight(sub)
  }
  return null
}

export function walk(v: KType, sub: KSubsitution): KType {
  if (v instanceof KVar) {
    const val = findVarDefine(v, sub)
    if (val) {
      //如果找到定义,对定义递归寻找
      return walk(getPairRight(val), sub)
    }
    return v
  } else if (Array.isArray(v)) {
    return v.map(x => walk(x, sub))
  } else {
    return v
  }
}
export function extendSubsitution<K, V>(
  key: K,
  value: V,
  parent: List<Pair<K, V>>
) {
  return pairOf(pairOf(key, value), parent)
}
export function unify(a: KType, b: KType, sub: KSubsitution): [boolean, KSubsitution] {
  a = walk(a, sub)
  b = walk(b, sub)
  if (a == b) {
    return [true, sub]
  }
  if (a instanceof KVar) {
    if (a.equals(b)) {
      return [true, sub]
    }
    return [true, extendSubsitution(a, b, sub)]
  }
  if (b instanceof KVar) {
    if (b.equals(a)) {
      return [true, sub]
    }
    return [true, extendSubsitution(b, a, sub)]
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length == b.length) {
      let tempSub = sub
      for (let i = 0; i < a.length; i++) {
        const [success, sub] = unify(a[i], b[i], tempSub)
        if (success) {
          tempSub = sub
        } else {
          return [false, null]
        }
      }
      return [true, tempSub]
    }
  }
  return [false, null]
}


export const kanren = {
  fresh() {
    return new KVar()
  },
  fail: <Goal<any>>function () {
    return null
  },
  success: <Goal<any>>function (sub) {
    return pairOf(sub, emptyDelayStream)
  },
  toUnify(sub: KSubsitution, a: KType, b: KType): Stream<KSubsitution> {
    const [success, sub1] = unify(a, b, sub)
    if (success) {
      return kanren.success(sub1)
    }
    return kanren.fail(sub1)
  },
  toOr<T>(sub: T, a: Goal<T>, b: Goal<T>) {
    return streamAppendStream(a(sub), function () {
      return b(sub)
    })
  },
  toAnd<T>(sub: T, a: Goal<T>, b: Goal<T>) {
    return streamBindGoal(a(sub), b)
  },
  toCut<T>(sub: T, a: Goal<T>, b: Goal<T>) {
    return a(sub) || b(sub)
  },
  or<T>(a: Goal<T>, b: Goal<T>): Goal<T> {
    return function (sub) {
      return kanren.toOr(sub, a, b)
    }
  },
  cut<T>(a: Goal<T>, b: Goal<T>): Goal<T> {
    return function (sub) {
      return kanren.toCut(sub, a, b)
    }
  },
  and<T>(a: Goal<T>, b: Goal<T>): Goal<T> {
    return function (sub) {
      return kanren.toAnd(sub, a, b)
    }
  },
  unify(a: KType, b: KType): Goal<KSubsitution> {
    return function (sub) {
      return kanren.toUnify(sub, a, b)
    }
  },
  toListTrans<T>(
    vs: T[],
    trans: (v: T, last?: boolean) => KType,
    asList = false,
    endWith = null
  ) {
    if (!vs.length) {
      if (asList) {
        return null
      } else {
        throw "不允许空列表转化"
      }
    }
    const lastIndex = vs.length - 1
    let ret: KType = asList ? endWith : trans(vs[lastIndex], true)
    for (let i = asList ? lastIndex : lastIndex - 1; i > -1; i--) {
      ret = pairOf(trans(vs[i], false), ret)
    }
    return ret
  },
  toList(vs: KType[], asList = false, endWidth: any = null) {
    return kanren.toListTrans(vs, quote, asList, endWidth)
  },
  toAnyList<T>(vs: T[]): List<T> {
    return kanren.toList(vs as unknown[] as KType[], true) as List<T>
  }
}