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



type KeepFun<T> = {
  shouldUpdate(newP: T, oldP: T): boolean
  call(fiber: WithDraftFiber<T>): void
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
  render: (v: T, i: number) => void
) {
  return useFiber(MapFiber, { vs, getKey, render }, shouldMapFiberUpdate)
}
type MapFiberProps<T> = {
  vs: T[],
  getKey: (v: T) => any,
  render: (v: T, i: number) => void
}
function shouldMapFiberUpdate<T>(newP: MapFiberProps<T>, oldP: MapFiberProps<T>) {
  return arrayNotEqual(newP.vs, oldP.vs, simpleNotEqual) || newP.getKey != oldP.getKey || newP.render != oldP.render
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
    const props = {
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
          shouldUpdate: shouldRenderRow as any,
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
  return newP.row != oldP.row || newP.index != oldP.index || newP.callback != oldP.callback
}
function renderRow<T>(fiber: WithDraftFiber<RenderRowProps<T>>) {
  const { row, index, callback } = fiber.draft.props
  callback(row, index)
}
////////****single****////////////////////////////////////////////////////////////////////////////////////////////////////////////
export function useOne<T>(v: T, getKey: (v: T) => any, render: (v: T) => void) {
  return useFiber(OneFiber, { v, getKey, render }, shouldOneFiberUpdate)
}
type OneFiberProps<T> = {
  v: T,
  getKey: (v: T) => any,
  render: (v: T) => void
}
function shouldOneFiberUpdate<T>(newP: OneFiberProps<T>, oldP: OneFiberProps<T>) {
  return oldP.v != newP.v || newP.getKey != oldP.getKey || newP.render != oldP.render
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
type GuardBaseFiberProps<A, T> = {
  v: T
  matches: GuardBaseFiber<A, T>[]
}
function getGuardFiber<A, T>(shouldDo: (a: A, v: T) => boolean) {
  return function (fiber: WithDraftFiber<GuardBaseFiberProps<A, T>>) {
    const cache = useMemo(() => {
      return {
        index: -1,
        fiber: fiber as Fiber
      }
    }, [])
    const { v, matches } = fiber.draft.props
    let commitWork: (() => void) | void = undefined
    useEffect(() => {
      if (commitWork) {
        commitWork()
      }
    })
    let noStop = true
    for (let i = 0; (i < matches.length) && noStop; i++) {
      const match = matches[i]
      if (shouldDo(match[0], v)) {
        const props = {
          value: v,
          callback: match[1]
        }
        if (cache.index == i) {
          //复用
          simpleUpdate(cache.fiber, props)
        } else {
          //删旧增新
          if (cache.index > -1) {
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
            cache.index = i
            cache.fiber = plaFiber
          }

          //只有一个节点,故是同一个
          fiber.draft.lastChild = plaFiber
          fiber.draft.child = plaFiber

          addAdd(plaFiber)
        }
        noStop = false
      }
    }
    if (noStop && cache.index > -1) {
      addDelect(cache.fiber)
      commitWork = () => {
        cache.index = -1
        cache.fiber = fiber
      }
      //
      fiber.draft.lastChild = undefined
      fiber.draft.child = undefined
    }
  }
}
function shouldGuardUpdate<A, T>(newP: GuardBaseFiberProps<A, T>, oldP: GuardBaseFiberProps<A, T>) {
  return newP.v != oldP.v || arrayNotEqual(newP.matches, oldP.matches, (x, y) => {
    return x[0] != y[0] || x[1] != y[1]
  })
}
////////****guard****////////////////////////////////////////////////////////////////////////////////////////////////////////////
type GuardMatchType<T> = GuardBaseFiber<(v: T) => boolean, T>
function isGuardMatch<T>(fun: (v: T) => boolean, v: T) {
  return fun(v)
}
const guardFiber = getGuardFiber(isGuardMatch)
export function useGuard<T>(v: T, ...matches: GuardMatchType<T>[]) {
  return useFiber(guardFiber, { v, matches }, shouldGuardUpdate)
}
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


////////****useIf****////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
  return useFiber(guardFiber, { v, matches }, shouldGuardUpdate)
}
function quote<T>(v: T) { return v }
function toOppsite(v: boolean) { return !v }
////////****useSwitch****////////////////////////////////////////////////////////////////////////////////////////////////////////////
type GuardSwitchType<T> = GuardBaseFiber<T, T>
function isSwitch<T>(a: T, v: T) {
  return a == v
}
const switchFiber = getGuardFiber(isSwitch)
export function useSwitch<T>(v: T, ...matches: GuardSwitchType<T>[]) {
  return useFiber(switchFiber, {
    v,
    matches
  }, shouldGuardUpdate)
}
////////****useGuardString****////////////////////////////////////////////////////////////////////////////////////////////////////////////
export function useGuardString(
  value: string,
  map: {
    [key: string]: (k: string) => void
  }
) {
  return useFiber(guardConfig.call, { value, map }, guardConfig.shouldUpdate)
}
const guardConfig: KeepFun<{
  value: string
  map: {
    [key: string]: (k: string) => void
  }
}> = {
  shouldUpdate(newP, oldP) {
    return newP.value != oldP.value || newP.map != oldP.map
  },
  call(fiber) {
    const { value, map } = fiber.draft.props
    const cache = useMemo(() => {
      return {
        key: "",
        fiber: fiber as any
      }
    }, [])
    let commitWork: (() => void) | void = undefined
    useEffect(() => {
      if (commitWork) {
        commitWork()
      }
    })
    let noStop = true
    const entitys = Object.entries(map)
    for (let i = 0; i < entitys.length && noStop; i++) {
      const [key, callback] = entitys[i]
      if (value == key) {
        const props = {
          value: key,
          callback
        }
        if (cache.key == key) {
          //复用
          simpleUpdate(cache.fiber, props)
        } else {
          //删旧增新
          if (cache.fiber != fiber) {
            addDelect(cache.fiber)
          }
          const draftFiber: PlacementFiber<CacheNodeProps<string>> = {
            effectTag: "PLACEMENT",
            parent: fiber,
            draft: {
              render: cacheNode,
              shouldUpdate: shouldCacheNodeUpdate,
              props
            }
          }
          commitWork = () => {
            cache.key = key
            cache.fiber = draftFiber
          }
          //只有一个节点,故是同一个
          fiber.draft.child = draftFiber
          fiber.draft.lastChild = draftFiber

          addAdd(draftFiber)
        }
        noStop = false
      }
    }
    if (noStop && cache.fiber != fiber) {
      addDelect(cache.fiber)
      commitWork = (() => {
        cache.key = ""
        cache.fiber = fiber
      })
      //置空
      fiber.draft.lastChild = undefined
      fiber.draft.child = undefined
    }
  }
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