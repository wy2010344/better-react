import { useEffect } from "better-react"
import { useEvent } from "./useEvent"
import { useChange, useState } from "./useState"
import { useMemo, useRef } from "./useRef"
import { FalseType } from "better-react/dist/util"
import { useVersionLock } from "./Lock"
import { useCallback } from "./useCallback"

export type PromiseResult<T> = {
  type: "success",
  value: T
} | {
  type: "error",
  value: any
}
export type GetPromise<T> = (...vs: any[]) => Promise<T>
type GetPromiseResult<T> = PromiseResult<T> & {
  getPromise: GetPromise<T>
}
type OnFinally<T> = (
  data: GetPromiseResult<T>,
  ...vs: any[]
) => void
function usePromise<T>(
  getPromise: GetPromise<T> | FalseType,
  initOnFinally: OnFinally<T>
) {
  const onFinally = useEvent(function (data: GetPromiseResult<T>) {
    if (getPromise == data.getPromise) {
      initOnFinally(data)
    }
  })
  useEffect(doGetPromise as any, [getPromise, onFinally])
}
function doGetPromise<T>([getPromise, onFinally]: [GetPromise<T> | FalseType, (data: GetPromiseResult<T>) => void]) {
  if (getPromise) {
    getPromise().then(data => {
      onFinally({ type: "success", value: data, getPromise })
    }).catch(err => {
      onFinally({ type: "error", value: err, getPromise })
    })
  }
}

export function useMemoPromiseCall<T, Deps extends readonly any[]>(
  onFinally: OnFinally<T>,
  effect: (deps: Deps, ...vs: any[]) => GetPromise<T> | FalseType,
  deps: Deps
) {
  const getPromise = useMemo(effect, deps)
  usePromise(getPromise, onFinally)
  return getPromise
}
export function useCallbackPromiseCall<T, Deps extends readonly any[]>(
  onFinally: OnFinally<T>,
  callback: (deps: Deps, ...vs: any[]) => Promise<T>,
  deps: Deps
) {
  const getPromise = useMemo((dep) => {
    return function () {
      return callback(dep)
    }
  }, deps)
  usePromise(getPromise, onFinally)
  return getPromise
}
/**
 * 内部状态似乎不应该允许修改
 * 后面可以使用memo合并差异项
 * @param param0 
 * @param deps 
 * @returns [生效的数据,是否在loading]
 */
export function useBaseMemoPromiseState<T, Deps extends readonly any[]>(
  onFinally: undefined | OnFinally<T>,
  effect: (deps: Deps, ...vs: any[]) => GetPromise<T> | FalseType,
  deps: Deps
) {
  const [data, updateData] = useChange<PromiseResult<T> & {
    getPromise: GetPromise<T>
  }>()
  const hasPromise = useMemoPromiseCall((data) => {
    onFinally?.(data)
    updateData(data)
  }, effect, deps)
  const outData = hasPromise ? data : undefined
  return [outData, outData?.getPromise != hasPromise] as const
}
export function useMemoPromiseState<T, Deps extends readonly any[]>(
  effect: (deps: Deps, ...vs: any[]) => GetPromise<T> | FalseType,
  deps: Deps
) {
  return useBaseMemoPromiseState(undefined, effect, deps)
}
export function useBaseCallbackPromiseState<T, Deps extends readonly any[]>(
  onFinally: undefined | OnFinally<T>,
  effect: (deps: Deps, ...vs: any[]) => Promise<T>,
  deps: Deps
) {
  const [data, updateData] = useChange<PromiseResult<T> & {
    getPromise: GetPromise<T>
  }>()
  const hasPromise = useCallbackPromiseCall((data) => {
    onFinally?.(data)
    updateData(data)
  }, effect, deps)
  return [data, data?.getPromise != hasPromise] as const
}

export function useCallbackPromiseState<T, Deps extends readonly any[]>(
  effect: (deps: Deps, ...vs: any[]) => Promise<T>,
  deps: Deps
) {
  return useBaseCallbackPromiseState(undefined, effect, deps)
}

export function useMutation<Req extends any[], Res>(effect: (...vs: Req) => Promise<Res>) {
  const boolLock = useRef(false)
  return function (...vs: Req) {
    if (boolLock.get()) {
      return
    }
    boolLock.set(true)
    return effect(...vs).finally(() => {
      boolLock.set(false)
    })
  }
}

export type MutationState<T> = PromiseResult<T> & {
  version: number
}
export function useMutationState<Req extends any[], Res>(effect: (...vs: Req) => Promise<Res>) {
  const [getVersion, updateVersion] = useVersionLock()
  const [data, updateData] = useChange<MutationState<Res>>()
  return [useEvent(function (...vs: Req) {
    if ((data?.version || 0) != getVersion()) {
      return
    }
    const version = updateVersion()
    effect(...vs).then(res => {
      updateData({ type: "success", value: res, version })
    }).catch(err => {
      updateData({ type: "error", value: err, version })
    })
  }), data] as const
}