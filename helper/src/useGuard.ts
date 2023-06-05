import { useOneF } from "better-react"
import { emptyFun } from "./ValueCenter"
type GuardBaseFiber<A, T> = (readonly [
  A,
  (v: T) => void
])
function findFirst<A, T>(
  matches: GuardBaseFiber<A, T>[],
  value: T,
  equal: (a: A, v: T) => boolean
) {
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i]
    if (equal(match[0], value)) {
      return [i, match[1]] as const
    }
  }
  return [-1, emptyFun] as const
}
////////****guard****////////////////////////////////////////////////////////////////////////////////////////////////////////////
type GuardMatchType<T> = GuardBaseFiber<(v: T) => any, T>
function guardMatchEqual<T>(a: (v: T) => boolean, v: T) {
  return a(v)
}
export function useBaseGuard<T>(v: T, matches: GuardMatchType<T>[]) {
  useOneF(v, function (v) {
    const [index, match] = findFirst(matches, v, guardMatchEqual)
    return [index, function () {
      match(v)
    }]
  })
}
export function useGuard<T>(v: T, ...matches: GuardMatchType<T>[]) {
  useBaseGuard(v, matches)
}
////////****useIf****////////////////////////////////////////////////////////////////////////////////////////////////////////////
function quote<T>(v: T) { return v }
function toOppsite(v: boolean) { return !v }
/**
 * 虽然返回filter,是否返回自定义hook内部返回的变量呢?render是条件才触发,跟useXXX是不同的.
 * @param v 
 * @param whenTrue 
 * @param whenFalse 
 * @returns 
 */
export function useIf(
  v: any,
  whenTrue: () => void,
  whenFalse?: () => void
) {
  const matches: GuardMatchType<boolean>[] = [
    [
      quote,
      whenTrue
    ]
  ]
  if (whenFalse) {
    matches.push([
      toOppsite,
      whenFalse
    ])
  }
  return useBaseGuard(v, matches)
  // return useFiber(guardFiber, { v, matches }, shouldGuardUpdate)
}
////////****useSwitch****////////////////////////////////////////////////////////////////////////////////////////////////////////////
type GuardSwitchType<T> = GuardBaseFiber<T, T>
function isSwitch<T>(a: T, v: T) {
  return a == v
}
export function useSwitch<T>(v: T, ...matches: GuardSwitchType<T>[]) {
  return useOneF(v, function (v) {
    const [index, match] = findFirst(matches, v, isSwitch)
    return [index, function () {
      match(v)
    }]
  })
}
////////****useGuardString****////////////////////////////////////////////////////////////////////////////////////////////////////////////
type MatchStringOne = {
  key: string
  match(v: string): void
}
function findMatchString<T extends string>(value: T, map: {
  [key in T]?: (k: string) => void
}) {
  for (let key in map) {
    if (key == value) {
      const match = map[key]
      if (match) {
        return {
          key,
          match
        } as MatchStringOne
      }
    }
  }
}

export function useGuardString<T extends string>(
  value: T,
  map: {
    [key in T]?: (k: string) => void
  }
) {
  return useOneF(value, function (value) {
    const matches = findMatchString(value, map)
    return [matches?.key, function () {
      matches?.match(value)
    }]
  })
}
