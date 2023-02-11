import { useOne } from "better-react"
type GuardBaseFiber<A, T> = (readonly [
  A,
  (v: T) => void
])
function findFirst<A, T>(
  matches: GuardBaseFiber<A, T>[],
  value: T,
  equal: (a: A, v: T) => boolean,
  shouldUpdate?: (a: T, b: T) => boolean
) {
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i]
    if (equal(match[0], value)) {
      return {
        index: i,
        value,
        match,
        shouldUpdate
      }
    }
  }
}
type MatchOne<A, T> = {
  index: number
  value: T
  match: GuardBaseFiber<A, T>
  shouldUpdate?: (a: T, b: T) => boolean
}
function getMatchOneIndex(v?: MatchOne<any, any>) {
  if (v) {
    return v.index
  } else {
    return -1
  }
}
function renderMatchOne<T>(v?: MatchOne<any, T>) {
  if (v) {
    return v.match[1](v.value)
  }
}
function shoudMatchOneUpdate<A, T>(a: MatchOne<A, T> | undefined, b: MatchOne<A, T> | undefined) {
  if (a == b) {
    return false
  }
  if (a && b) {
    if (a.match != b.match || a.shouldUpdate != b.shouldUpdate) {
      return true
    }
    if (a.shouldUpdate) {
      return a.shouldUpdate(a.value, b.value)
    }
    return a.value != b.value
  }
  return true
}
////////****guard****////////////////////////////////////////////////////////////////////////////////////////////////////////////
type GuardMatchType<T> = GuardBaseFiber<(v: T) => any, T>
function guardMatchEqual<T>(a: (v: T) => boolean, v: T) {
  return a(v)
}
export function useBaseGuard<T>(v: T, matches: GuardMatchType<T>[], shouldUpdate?: (a: T, b: T) => boolean) {
  const match = findFirst(matches, v, guardMatchEqual, shouldUpdate)
  return useOne(match, getMatchOneIndex, renderMatchOne, shoudMatchOneUpdate)
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
  const match = findFirst(matches, v, isSwitch)
  return useOne(match, getMatchOneIndex, renderMatchOne, shoudMatchOneUpdate)
}
////////****useGuardString****////////////////////////////////////////////////////////////////////////////////////////////////////////////
type MatchStringOne = {
  key: string
  match(v: string): void
}
function getMatchStringOneIndex(v?: MatchStringOne) {
  if (v) {
    return v.key
  }
}
function renderMatchStringOne<T>(v?: MatchStringOne) {
  if (v) {
    return v.match(v.key)
  }
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
function shoudMatchStringOneUpdate(a: MatchStringOne | undefined, b: MatchStringOne | undefined) {
  if (a == b) {
    return false
  }
  if (a && b) {
    if (a.match == b.match) {
      return false
    }
    //key已经作为对比了
  }
  return true
}
export function useGuardString<T extends string>(
  value: T,
  map: {
    [key in T]?: (k: string) => void
  }
) {
  const matches = findMatchString(value, map)
  return useOne(matches, getMatchStringOneIndex, renderMatchStringOne, shoudMatchStringOneUpdate)
}
