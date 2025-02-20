import { buildPromiseResultSetData, emptyFun, emptyObject, FalseType, GetPromiseRequest, GetValue, hookAbortSignalPromise, RequestPromiseFinally, RequestPromiseResult, RequestVersionPromiseFinally, RequestVersionPromiseReulst } from "wy-helper";
import { useEffect } from "./useEffect";
import { useEvent } from "./useEvent";
import { useMemo, useRef } from "./useRef";
import { useState } from "./useState";

export function useRenderPromise<T>(
  /**触发事件 */
  initFinally: RequestPromiseFinally<T>,
  /**作为依赖 */
  request?: GetPromiseRequest<T> | FalseType
) {
  const onFinally: RequestPromiseFinally<T> = useEvent(function (data) {
    if (request == data.request) {
      initFinally(data)
    }
  })
  useEffect(() => {
    if (request) {
      const abortController = new AbortController()
      hookAbortSignalPromise(abortController.signal, request, value => {
        const v = value as RequestPromiseResult<T>
        v.request = request
        onFinally(v)
      })
      return abortController.abort.bind(abortController)
    }
  }, request)
}
/**
 * 有了版本,方便添加promise
 * @param initFinally 
 * @param request 
 * @returns 
 */
export function useRenderVersionPromise<T>(
  /**触发事件 */
  initFinally: RequestVersionPromiseFinally<T>,
  /**作为依赖,如果request发生改变,则触发依赖计算 */
  request?: GetPromiseRequest<T> | FalseType
) {
  const ref = useRef(1)
  const version = useMemo(() => {
    return ref.current++
  }, [request])
  useRenderPromise(data => {
    const d = data as RequestVersionPromiseReulst<T>
    d.version = version
    initFinally(d)
  }, request)
  return version
}







export function useCallbackPromiseState<T>(
  outRequest: GetPromiseRequest<T>,
  deps: readonly any[]
) {
  return useMemoPromiseState(() => outRequest, deps)
}


export function useMemoPromise<T>(
  request: GetPromiseRequest<T> | FalseType,
  {
    onSuccess = emptyFun,
    onError = emptyFun
  }: {
    onSuccess?(value: T): void
    onError?(err: any): void
  } = emptyObject
) {
  const [data, setData] = useState<RequestPromiseResult<T>>()
  useRenderPromise(function (data) {
    if (data.type == 'error') {
      onError(data.value)
    } else {
      onSuccess(data.value)
    }
    setData(data)
  }, request)
  return {
    data: request ? data : undefined,
    loading: data?.request != request,
    setData: buildPromiseResultSetData(setData),
  }
}


export function useMemoPromiseState<T>(
  outRequest: () => GetPromiseRequest<T> | FalseType,
  deps: readonly any[]
) {
  return useMemoPromise(useMemo(outRequest, deps))
}
export function useCallbackPromise<T>(arg: {
  onSuccess?(value: T): void
  onError?(err: any): void
  body: GetPromiseRequest<T>
}, deps: readonly any[]) {
  return useMemoPromise(useMemo(() => arg.body, deps), arg)
}