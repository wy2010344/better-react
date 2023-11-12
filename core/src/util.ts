import { StoreRef } from "./commitWork"



/**6种情况为false,NaN是数字类型*/
export type FalseType = false | undefined | null | 0 | ""
export type EmptyFun = (...vs: any[]) => void


export const emptyArray = [] as readonly any[]
export const emptyObject = {}
export function emptyFun(...vs: any[]) { }

export function simpleEqual<T>(a: T, b: T) {
  return a == b
}

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

export function buildRemoveWhere<T, M>(equal: (m: M, a: T, idx: number) => any) {
  return function (vs: T[], m: M) {
    let count = 0
    for (let i = vs.length - 1; i > -1; i--) {
      const row = vs[i]
      if (equal(m, row, i)) {
        vs.splice(i, 1)
        count++
      }
    }
    return count
  }
}
export const removeEqual = buildRemoveWhere(simpleEqual)

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
export function storeRef<T>(value: T, ...vs: any[]) {
  return new StoreRefImpl(value) as StoreRef<T>
}
export type AnyFunction = (...vs: any[]) => any
export function quote<T>(v: T, ...vs: any[]) { return v }
export function expandFunCall<T extends AnyFunction>(
  fun: T
) {
  fun()
}
export function expandFunReturn<T extends AnyFunction>(
  fun: T
) {
  return fun()
}
export interface ManageValue<T> {
  add(v: T): void
  remove(v: T): void
}