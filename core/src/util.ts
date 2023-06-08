import { StoreRef } from "./Fiber"

export function simpleEqual<T>(a: T, b: T) {
  return a == b
}

/**6种情况为false,NaN是数字类型*/
export type FalseType = false | undefined | null | 0 | ""
export function arrayEqual<T>(a1: readonly T[], a2: readonly T[], equal: (x: T, y: T) => boolean) {
  if (a1 == a2) {
    return true
  }
  const len = a1.length
  if (a2.length == len) {
    for (let i = 0; i < len; i++) {
      if (!equal(a1[i], a2[i])) {
        return false
      }
    }
    return true
  }
  return false
}

export function arrayNotEqualDepsWithEmpty(a?: readonly any[], b?: readonly any[]) {
  return !(a && b && arrayEqual(a, b, simpleEqual))
}

export function removeWhere<T, M>(vs: T[], equal: (m: M, a: T, idx: number) => boolean, m: M) {
  for (let i = vs.length - 1; i > -1; i--) {
    const row = vs[i]
    if (equal(m, row, i)) {
      vs.splice(i, 1)
    }
  }
}
export function removeEqual<T>(vs: T[], v: T) {
  removeWhere(vs, simpleEqual, v)
}

class StoreRefImpl<T> implements StoreRef<T>{
  constructor(
    private value: T
  ) { }
  get() {
    return this.value
  }
  set(v: T): void {
    this.value = v
  }
}
export function storeRef<T>(value: T) {
  return new StoreRefImpl(value) as StoreRef<T>
}