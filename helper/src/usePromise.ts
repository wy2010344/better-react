import { arrayEqual, simpleEqual, useEffect } from "better-react"
import { useEvent } from "./useEvent"
import { useChange } from "./useState"

export type PromiseResult<T> = {
  type: "success",
  value: T
} | {
  type: "error",
  value: any
}
export function usePromise<T>({
  disable,
  body,
  onFinally: initOnFinally
}: {
  disable?: boolean
  body(): Promise<T>
  onFinally(data: PromiseResult<T>): void
}, deps: readonly any[]) {
  const onFinally = useEvent(function (data: PromiseResult<T>, beforeDeps: readonly any[]) {
    if (arrayEqual(deps, beforeDeps, simpleEqual)) {
      initOnFinally(data)
    }
  })
  useEffect(() => {
    if (disable) {
      return
    }
    body().then(data => {
      onFinally({ type: "success", value: data }, deps)
    }).catch(err => {
      onFinally({ type: "error", value: err }, deps)
    })
  }, deps)
}

/**
 * 仅与memo相关
 * @param effect 
 * @param deps 
 * @returns 
 */
export function usePromiseMemo<T>(effect: () => Promise<T>, deps: readonly any[]) {
  const change = useChange<PromiseResult<T>>()
  usePromise({
    body: effect,
    onFinally: change[1]
  }, deps)
  return change
}
export type PromiseVersionResult<T> = PromiseResult<T> & {
  version: number
}
export function usePromiseVersion<T>({
  version,
  body,
  disable
}: {
  version: number,
  body(): Promise<T>
  disable?: boolean
}) {
  const change = useChange<PromiseVersionResult<T>>()
  usePromise({
    disable,
    body,
    onFinally(data) {
      change[1]({
        ...data,
        version
      })
    },
  }, [version])
  return change
}