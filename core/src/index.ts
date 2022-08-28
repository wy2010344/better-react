import { addAdd, addDelect, addUpdate, } from "./commitWork"
import { arrayNotEqual, simpleNotEqual, storeRef, toWithDraftFiber, useEffect, useFiber, useMemo } from "./fc"
import { Fiber, fiberDataClone, getEditData, isWithDraftFiber, PlacementFiber, VirtaulDomNode, WithDraftFiber } from "./Fiber"
import { AskNextTimeWork, setRootFiber } from "./reconcile"
export { flushSync, startTransition } from './reconcile'
export type { REAL_WORK } from './reconcile'
export { useState, useEffect, storeRef, useMemo, createContext, useFiber, arrayEqual, arrayNotEqual, simpleEqual, simpleNotEqual } from './fc'
export type { Fiber, Props, VirtaulDomNode, WithDraftFiber, PlacementFiber, FindParentAndBefore } from './Fiber'
export type { AskNextTimeWork }
export { createChangeAtom, ChangeAtomValue } from './commitWork'

export function render<T>(
  render: (v: WithDraftFiber<T>) => void,
  props: T,
  shouldUpdate: (a: T, b: T) => boolean,
  ask: AskNextTimeWork
) {
  const rootFiber: Fiber<T> = {
    effectTag: "PLACEMENT",
    draft: {
      render,
      shouldUpdate,
      props
    }
  } as const
  return setRootFiber(rootFiber, ask)
}


function simpleUpdate(fiber: Fiber, props: any) {
  if (isWithDraftFiber(fiber)) {
    fiber.draft.props = props

    addUpdate(fiber)
  } else {
    if (fiber.current.shouldUpdate(props, fiber.current.props)) {
      const draft = fiberDataClone(fiber.current)
      draft.props = props

      const nOldFiber = fiber as any
      nOldFiber.effectTag = "UPDATE"
      nOldFiber.draft = draft

      addUpdate(nOldFiber)
    }
  }
}
////////****useMap****////////////////////////////////////////////////////////////////////////////////////////////////////////////
export function useMap<T>(
  vs: T[],
  getKey: (v: T) => any,
  render: (v: T, i: number) => void,
  shouldUpdate?: (newV: T, oldV: T) => boolean
) {
  return useFiber(MapFiber, { vs, getKey, render, shouldUpdate }, shouldMapFiberUpdate)
}
type MapFiberProps<T> = {
  vs: T[],
  getKey: (v: T) => any,
  render: (v: T, i: number) => void
  shouldUpdate?: (newV: T, oldV: T) => boolean
}
function shouldMapFiberUpdate<T>(newP: MapFiberProps<T>, oldP: MapFiberProps<T>) {
  if (newP.getKey != oldP.getKey || newP.render != oldP.render || newP.shouldUpdate != oldP.shouldUpdate) {
    return true
  }
  if (newP.shouldUpdate) {
    return arrayNotEqual(newP.vs, oldP.vs, newP.shouldUpdate)
  }
  return arrayNotEqual(newP.vs, oldP.vs, simpleNotEqual)
}

function cloneMap<T>(map: Map<any, T[]>) {
  const newMap = new Map<any, T[]>()
  map.forEach(function (v, k) {
    newMap.set(k, v.slice())
  })
  return newMap
}
function MapFiber<T>(fiber: WithDraftFiber<MapFiberProps<T>>) {
  const mapRef = useMemo(() => storeRef(new Map<any, Fiber<RenderRowProps<T>>[]>()), [])
  const oldMap = cloneMap(mapRef.get())
  const newMap = new Map<any, Fiber<RenderRowProps<T>>[]>()
  useEffect(() => {
    mapRef.set(newMap)
  })
  const draft = fiber.draft
  const { vs, getKey, render } = draft.props

  let beforeFiber: Fiber | undefined = undefined

  //提前置空
  draft.child = undefined
  draft.lastChild = undefined

  for (let i = 0; i < vs.length; i++) {
    const v = vs[i]
    const key = getKey(v)
    const oldFibers = oldMap.get(key)
    let oldFiber = oldFibers?.[0]
    const props: RenderRowProps<T> = {
      callback: render,
      row: v,
      index: i
    }
    if (oldFiber) {
      //因为新排序了,必须产生draft用于排序.
      const oldDraft = toWithDraftFiber(oldFiber).draft
      oldDraft.props = props
      oldDraft.prev = beforeFiber

      addUpdate(oldFiber)
      oldFibers?.shift()
    } else {
      const tempFiber: PlacementFiber<RenderRowProps<T>> = {
        effectTag: "PLACEMENT",
        parent: fiber,
        draft: {
          render: renderRow,
          //这里是没有意义的,只是强制需要一个点位
          shouldUpdate: shouldRenderRow,
          props,
          prev: beforeFiber
        }
      }
      oldFiber = tempFiber
      addAdd(tempFiber)
    }
    const newFibers = newMap.get(key) || []
    if (newFibers.length > 0) {
      console.warn(`重复的key---重复${newFibers.length}次数`, key)
    }
    newFibers.push(oldFiber)
    newMap.set(key, newFibers)

    //构建双向树
    if (beforeFiber) {
      getEditData(beforeFiber).sibling = oldFiber
    } else {
      draft.child = oldFiber
    }
    draft.lastChild = oldFiber
    getEditData(oldFiber).sibling = undefined

    beforeFiber = oldFiber
  }

  for (const olds of oldMap.values()) {
    for (const old of olds) {
      addDelect(old)
    }
  }
}

type RenderRowProps<T> = {
  row: T,
  index: number,
  callback(row: T, index: number): void
}
function shouldRenderRow<T>(newP: RenderRowProps<T>, oldP: RenderRowProps<T>) {
  return true
}
function renderRow<T>(fiber: WithDraftFiber<RenderRowProps<T>>) {
  const { row, index, callback } = fiber.draft.props
  callback(row, index)
}
////////****single****////////////////////////////////////////////////////////////////////////////////////////////////////////////
type CacheNodeProps<T> = {
  value: T,
  callback(v: T): void
}
function shouldCacheNodeUpdate<T>(newP: CacheNodeProps<T>, oldP: CacheNodeProps<T>) {
  return newP.value != oldP.value || newP.callback != oldP.callback
}
function cacheNode<T>(fiber: WithDraftFiber<CacheNodeProps<T>>) {
  const { value, callback } = fiber.draft.props
  callback(value)
}
export function useOne<T>(v: T, getKey: (v: T) => any, render: (v: T) => void, shouldUpdate?: (newV: T, oldV: T) => boolean) {
  return useFiber(OneFiber, { v, getKey, render, shouldUpdate }, shouldOneFiberUpdate)
}
type OneFiberProps<T> = {
  v: T,
  shouldUpdate?: (a: T, b: T) => boolean
  getKey: (v: T) => any,
  render: (v: T) => void
}
function shouldOneFiberUpdate<T>(newP: OneFiberProps<T>, oldP: OneFiberProps<T>) {
  if (newP.getKey != oldP.getKey || newP.render != oldP.render || newP.shouldUpdate != oldP.shouldUpdate) {
    return true
  }
  if (newP.shouldUpdate) {
    return newP.shouldUpdate(newP.v, oldP.v)
  }
  return oldP.v != newP.v
}
function OneFiber<T>(fiber: WithDraftFiber<OneFiberProps<T>>) {
  const { v, getKey, render } = fiber.draft.props

  const cache = useMemo(() => {
    return {
      key: null,
      //使用父节点做锚点
      fiber: fiber as Fiber
    }
  }, [])
  let commitWork: (() => void) | void = undefined
  useEffect(() => {
    if (commitWork) {
      commitWork()
    }
  })
  const props = {
    value: v,
    callback: render
  }
  const newKey = getKey(v)
  if (cache.key == newKey && cache.fiber != fiber) {
    //复用
    simpleUpdate(cache.fiber, props)
  } else {
    //删旧增新
    if (cache.fiber != fiber) {
      addDelect(cache.fiber)
    }
    const plaFiber: PlacementFiber<CacheNodeProps<T>> = {
      effectTag: "PLACEMENT",
      parent: fiber,
      draft: {
        render: cacheNode,
        shouldUpdate: shouldCacheNodeUpdate,
        props,
      }
    }
    commitWork = () => {
      cache.key = newKey
      cache.fiber = plaFiber
    }
    //只有一个节点,故是同一个
    fiber.draft.lastChild = plaFiber
    fiber.draft.child = plaFiber

    addAdd(plaFiber)
  }
}
////////****guard****////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
type GuardMatchType<T> = GuardBaseFiber<(v: T) => boolean, T>
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
export function useIf(
  v: boolean,
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
  useBaseGuard(v, matches)
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
////////****类似函数式组件****////////////////////////////////////////////////////////////////////////////////////////////////////////////
export function useFragment(fun: () => void): Fiber<FragmentProps<void>>
export function useFragment<T>(fun: (v: T) => void, v: T): Fiber<FragmentProps<T>>;
export function useFragment<T>(fun: (v?: T) => void, v?: T): Fiber<FragmentProps<T>> {
  return useFiber<FragmentProps<T>>(Fragment, { call: fun, args: v }, fragmentShouldUpdate)
}
type FragmentProps<T> = {
  call(v?: T): void
  args?: T
} | {
  call(v: T): void
  args: T
}
function fragmentShouldUpdate<T>(newP: FragmentProps<T>, oldP: FragmentProps<T>) {
  return newP.call != oldP.call || newP.args != oldP.args
}
function Fragment<T>(fiber: WithDraftFiber<{
  call(v?: T): void
  args?: T
}>) {
  const { call, args } = fiber.draft.props
  call(args)
}