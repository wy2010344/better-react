import { addAdd, addDelect, addUpdate } from "./commitWork"
import { storeRef, useFiber, useMemo } from "./fc"
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


export function useMap<T>(
  vs: T[],
  getKey: (v: T) => any,
  render: (v: T, i: number) => void
) {
  useFiber(MapFiber, { vs, getKey, render })
}
function MapFiber<T>(fiber: Fiber<{
  vs: T[],
  getKey: (v: T) => any,
  render: (v: T, i: number) => void
}>) {
  const mapRef = useMemo(() => storeRef(new Map<any, Fiber[]>()), [])
  const oldMap = mapRef.get()
  const newMap = new Map<any, Fiber[]>()
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
        render: RenderRow,
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

function RenderRow<T>(fiber: Fiber<{
  row: T,
  index: number,
  callback(row: T, index: number): void
}>) {
  const { row, index, callback } = fiber.props
  callback(row, index)
}


export function useGuard<T>(v: T, ...matches: (readonly [(v: T) => boolean, (v: T) => void])[]) {
  useFiber(GuardFiber, { v, matches })
}
function GuardFiber<T>(fiber: Fiber<{
  v: T
  matches: (readonly [(v: T) => boolean, (v: T) => void])[]
}>) {
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
    if (match[0](v)) {
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
          render: CacheNode,
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

function CacheNode<T>(fiber: Fiber<{
  value: T,
  callback(v: T): void
}>) {
  const { value, callback } = fiber.props
  callback(value)
}


export function useIf(
  v: boolean,
  whenTrue: () => void,
  whenFalse?: () => void
) {
  useGuard(v,
    [
      v => v,
      whenTrue
    ],
    [
      v => !v,
      () => whenFalse?.()
    ]
  )
}

export function useSwitch<T>(v: T, ...matches: [T, (v: T) => void][]) {
  return useGuard(v, ...matches.map(function ([a, b]) {
    return [(x: T) => a == x, b] as const
  }))
}

export function useSwitchString(
  v: string,
  map: {
    [key: string]: () => void
  }
) {
}

export function useGuardString(value: string, map: {
  [key: string]: (k: string) => void
}) {
  return useFiber(GuardStringFilber, { value, map })
}
function GuardStringFilber(fiber: Fiber<{
  value: string
  map: {
    [key: string]: (k: string) => void
  }
}>) {
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
          render: CacheNode,
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
export function useFragment(fun: () => void): void
export function useFragment<T>(fun: (v: T) => void, v: T): void;
export function useFragment<T>(fun: (v?: T) => void, v?: T): void {
  useFiber<{
    call(v?: T): void
    args?: T
  }>(Fragment, { call: fun, args: v })
}

function Fragment<T>(fiber: Fiber<{
  call(v?: T): void
  args?: T
}>) {

  const { call, args } = fiber.props
  call(args)
}