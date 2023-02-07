import { useMemo } from "better-react"
export function memoList<T extends (...vs: any[]) => any>(fun: T): T {
  return function (...vs) {
    return useMemo(() => {
      return fun.apply(null, vs)
    }, vs)
  } as T
}


export function memoMap<T extends (a: any) => any>(fun: T): T {
  return function (object) {
    const defs = []
    if (object) {
      for (const key in object) {
        defs.push(key)
        defs.push(object[key])
      }
    }
    return useMemo(() => {
      return fun.call(null, object)
    }, defs)
  } as T
}