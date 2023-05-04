import { useEffect } from "better-react"
import { useEvent } from "./useEvent"

export type PromiseResult<T> = {
  type: "success",
  value: T
} | {
  type: "error",
  value: any
}
export function usePromise<T>({
  version,
  body,
  onFinally: initOnFinally
}: {
  version: number
  body(): Promise<T>
  onFinally(data: PromiseResult<T>): void
}) {
  const onFinally = useEvent(function (data: PromiseResult<T>, callVersion: number) {
    if (version == callVersion) {
      initOnFinally(data)
    }
  })
  useEffect(() => {
    body().then(data => {
      onFinally({ type: "success", value: data }, version)
    }).catch(err => {
      onFinally({ type: "error", value: err }, version)
    })
  }, [version])
}