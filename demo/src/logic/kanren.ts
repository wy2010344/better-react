

export interface Pair<L, R> {
  getLeft(): L
  getRight(): R
}
export class APair<L, R> implements Pair<L, R>{
  private constructor(
    private readonly left: L,
    private readonly right: R
  ) { }
  static of<L, R>(left: L, right: R) {
    return new APair(left, right)
  }
  getLeft(): L {
    return this.left
  }
  getRight(): R {
    return this.right
  }
}

export class AVar {
  constructor(
    public readonly name: string
  ) { }
}

type NotNullList<T> = Pair<T, List<T>>
export type List<T> = NotNullList<T> | null
/**
 * 作用域,key是AVar,value是特定类型
 */
type ASubsitution<T> = List<Pair<AVar, T>>

function extendSubsitution<K, V>(k: K, v: V, parent: List<Pair<K, V>>) {
  return APair.of(APair.of(k, v), parent)
}
function find<T>(k: AVar, sub: ASubsitution<T>) {
  while (sub) {
    const kv = sub.getLeft()
    if (kv.getLeft() == k) {
      return kv
    }
    sub = sub.getRight()
  }
  return null
}

type AType = AVar | string | number | null | { [key: string]: AType } | (() => AType)
export function walk(k: AType, sub: ASubsitution<AType>): AType {
  if (k instanceof AVar) {
    const v = find(k, sub)
    if (v) {
      return walk(v.getRight(), sub)
    }
    return k
  } else if (k instanceof Function) {
    return k
  } else if (k && k instanceof Object) {
    const newMap = {} as any
    for (const key in k) {
      const value = walk(k[key], sub)
      newMap[key] = value
    }
    return newMap
  }
  return k
}

/**
 * 
 * @param a 过滤条件
 * @param b  目标对象
 * @param sub 
 * @returns 
 */
export function unify<T>(a: AType, b: AType, sub: ASubsitution<AType>): [boolean, ASubsitution<AType>] {
  a = walk(a, sub)
  b = walk(b, sub)
  if (a == b) {
    return [true, sub]
  }
  if (a instanceof AVar) {
    return [true, extendSubsitution(a, b, sub)]
  }
  if (b instanceof AVar) {
    return [true, extendSubsitution(b, a, sub)]
  }
  if (a instanceof Function || b instanceof Function) {
    return [false, null]
  }
  if (a && b && a instanceof Object && b instanceof Object) {
    for (const key in a) {
      const result = unify(a[key], b[key], sub)
      if (result[0]) {
        sub = result[1]
      } else {
        return [false, null]
      }
    }
    return [true, sub]
  }

  return [false, null]
}

/**流 */
export type AStream<V> = null | Pair<V, () => AStream<V>>

/**目标 */
export type AGoal<V> = (sub: V) => AStream<V>

export function streamAppendStream<V>(a: AStream<V>, b: () => AStream<V>): AStream<V> {
  if (a) {
    //将可能性b往后叠加
    return APair.of(a.getLeft(), function () {
      return streamAppendStream(a.getRight()(), b)
    })
  }
  return b()
}
export function streamBindGoal<V>(a: AStream<V>, b: AGoal<V>): AStream<V> {
  if (a) {
    //如果a确实存在可能性,将所有的可能性往b的目标里去过滤,再将结果流叠加起来.
    return streamAppendStream(b(a.getLeft()), function () {
      return streamBindGoal(a.getRight()(), b)
    })
  }
  return null
}

/**
 * 即达成a目标,也达成b目标
 * @param a 
 * @param b 
 * @returns 
 */
export function and<T>(a: AGoal<T>, b: AGoal<T>): AGoal<T> {
  return function (sub) {
    return streamBindGoal(a(sub), b)
  }
}

export function or<T>(a: AGoal<T>, b: AGoal<T>): AGoal<T> {
  return function (sub) {
    //在将a作为目标尝试,失败后,再将b作为目标尝试
    return streamAppendStream(a(sub), function () {
      return b(sub)
    })
  }
}

/**
 * Goal目标,是一个作用域,返回一个链的作用域.
 * 一个作用域里变量有一个解.
 * prolog的查询,是一个Goal,从初始化的空作用域,返回一个链
 * 
 * 过滤条件的本质,就是一个规则的body.
 */