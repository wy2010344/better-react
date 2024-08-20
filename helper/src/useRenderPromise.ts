import { buildPromiseResultSetData, createRequestPromise, FalseType, GetPromiseRequest, RequestPromiseFinally, RequestPromiseResult, RequestVersionPromiseFinally, RequestVersionPromiseReulst } from "wy-helper";
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
      return createRequestPromise(request, onFinally)
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


export function useMemoPromiseState<T>(
  outRequest: () => GetPromiseRequest<T> | FalseType,
  deps: readonly any[]
) {
  const request = useMemo(() => outRequest(), deps)
  const [data, setData] = useState<RequestPromiseResult<T>>()
  useRenderPromise(setData, request)
  return {
    data: request ? data : undefined,
    loading: data?.request != request,
    setData: buildPromiseResultSetData(setData),
  }
}

export function useCallbackPromiseState<T>(
  outRequest: GetPromiseRequest<T>,
  deps: readonly any[]
) {
  return useMemoPromiseState(() => outRequest, deps)
}