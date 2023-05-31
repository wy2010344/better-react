import { arrayEqual, simpleEqual, useEffect } from "better-react"
import { useEvent } from "./useEvent"

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