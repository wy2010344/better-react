import { addAdd, addDelect, addUpdate } from "./commitWork"
import { arrayNotEqual, simpleNotEqual, storeRef, useFiber, useMemo } from "./fc"
import { Fiber, VirtaulDomNode } from "./Fiber"
import { AskNextTimeWork, setRootFiber } from "./reconcile"
export { flushSync } from './reconcile'
export type { REAL_WORK } from './reconcile'
export { useState, useEffect, storeRef, useMemo, createContext } from './fc'
export type { Fiber, Props, VirtaulDomNode } from './Fiber'
export type { FindParentAndBefore } from './commitWork'
export type { AskNextTimeWork }
function RootFiberFun(fiber: Fiber<() => void>) {
  fiber.props()
}
export function render(
  element: () => void,
  container: VirtaulDomNode,
  ask: AskNextTimeWork
) {
  const rootFiber: Fiber = {
    render: RootFiberFun,
    dom: container,
    props: element,
    effectTag: "DIRTY"
  } as const
  return setRootFiber(rootFiber, ask)
}



type KeepFun<T> = {
  shouldUpdate(newP: T, oldP: T): boolean
  call(fiber: Fiber<T>): void
}



////////****useMap****////////////////////////////////////////////////////////////////////////////////////////////////////////////
export function useMap<T>(
  vs: T[],
  getKey: (v: T) => any,
  render: (v: T, i: number) => void
) {
  useFiber(MapFiber, { vs, getKey, render }, shouldMapFiberUpdate)
}
type MapFiberProps<T> = {
  vs: T[],
  getKey: (v: T) => any,
  render: (v: T, i: number) => void
}
function shouldMapFiberUpdate<T>(newP: MapFiberProps<T>, oldP: MapFiberProps<T>) {
  return arrayNotEqual(newP.vs, oldP.vs, simpleNotEqual) || newP.getKey != oldP.getKey || newP.render != oldP.render
}
function MapFiber<T>(fiber: Fiber<MapFiberProps<T>>) {
  const mapRef = useMemo(() => storeRef(new Map<any, Fiber<RenderRowProps<T>>[]>()), [])
  const oldMap = mapRef.get()
  const newMap = new Map<any, Fiber<RenderRowProps<T>>[]>()
  mapRef.set(newMap)
  const { vs, getKey, render } = fiber.props

  let beforeFiber: Fiber | undefined = undefined
  fiber.child = undefined

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
      oldFiber.props = props
      oldFiber.effectTag = "UPDATE"
      addUpdate(oldFiber)
      oldFibers?.shift()
    } else {
      oldFiber = {
        render: renderRow,
        shouldUpdate: shouldRenderRow as any,
        props,
        effectTag: "PLACEMENT",
        parent: fiber
      }
      addAdd(oldFiber)
    }
    const newFibers = newMap.get(key) || []
    if (newFibers.length > 0) {
      console.warn(`重复的key---重复${newFibers.length}次数`, key)
    }
    newFibers.push(oldFiber)
    newMap.set(key, newFibers)
    if (beforeFiber) {
      beforeFiber.sibling = oldFiber
    } else {
      fiber.child = oldFiber
    }
    oldFiber.sibling = undefined
    beforeFiber = oldFiber
  }

  for (const olds of oldMap.values()) {
    for (const old of olds) {
      old.effectTag = "DELETION"
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
function renderRow<T>(fiber: Fiber<RenderRowProps<T>>) {
  const { row, index, callback } = fiber.props
  callback(row, index)
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
  return function (fiber: Fiber<GuardBaseFiberProps<A, T>>) {
    const cache = useMemo(() => {
      return {
        index: -1,
        fiber: fiber as Fiber<any>
      }
    }, [])
    const { v, matches } = fiber.props

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
          cache.fiber.props = props
          cache.fiber.effectTag = "UPDATE"
          addUpdate(cache.fiber)
        } else {
          //删旧增新
          if (cache.index > -1) {
            cache.fiber.effectTag = "DELETION"
            addDelect(cache.fiber)
          }
          cache.index = i
          cache.fiber = {
            render: cacheNode,
            shouldUpdate: shouldCacheNodeUpdate,
            props,
            effectTag: "PLACEMENT",
            parent: fiber
          }
          fiber.child = cache.fiber
          addAdd(cache.fiber)
        }
        noStop = false
      }
    }
    if (noStop && cache.index > -1) {
      cache.index = -1
      addDelect(cache.fiber)
      cache.fiber = fiber
      fiber.child = undefined
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
  useFiber(guardFiber, { v, matches }, shouldGuardUpdate)
}
type CacheNodeProps<T> = {
  value: T,
  callback(v: T): void
}
function shouldCacheNodeUpdate<T>(newP: CacheNodeProps<T>, oldP: CacheNodeProps<T>) {
  return newP.value != oldP.value || newP.callback != oldP.callback
}
function cacheNode<T>(fiber: Fiber<CacheNodeProps<T>>) {
  const { value, callback } = fiber.props
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
  useFiber(guardFiber, { v, matches }, shouldGuardUpdate)
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
  useFiber(switchFiber, {
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
    const { value, map } = fiber.props
    const cache = useMemo(() => {
      return {
        key: "",
        fiber: fiber as any
      }
    }, [])
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
          cache.fiber.props = props
          cache.fiber.effectTag = "UPDATE"
          addUpdate(cache.fiber)
        } else {
          //删旧增新
          if (cache.fiber != fiber) {
            cache.fiber.effectTag = "DELETION"
            addDelect(cache.fiber)
          }
          cache.key = key
          cache.fiber = {
            render: cacheNode,
            shouldUpdate: shouldCacheNodeUpdate,
            props,
            effectTag: "PLACEMENT",
            parent: fiber
          }
          fiber.child = cache.fiber
          addAdd(cache.fiber)
        }
        noStop = false
      }
    }
    if (noStop && cache.fiber != fiber) {
      addDelect(cache.fiber)
      cache.fiber = fiber
      fiber.child = undefined
    }
  }
}
////////****类似函数式组件****////////////////////////////////////////////////////////////////////////////////////////////////////////////
export function useFragment(fun: () => void): void
export function useFragment<T>(fun: (v: T) => void, v: T): void;
export function useFragment<T>(fun: (v?: T) => void, v?: T): void {
  useFiber<FragmentProps<T>>(Fragment, { call: fun, args: v }, fragmentShouldUpdate)
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
function Fragment<T>(fiber: Fiber<{
  call(v?: T): void
  args?: T
}>) {
  const { call, args } = fiber.props
  call(args)
}