import { startTransition } from "better-react";
import { useChange } from "./useState";
import { useEffect } from "./useEffect";
export function useTransition() {
  const [isPending, setIsPending] = useChange(false)
  return [isPending, function (fun: () => void) {
    setIsPending(true)
    startTransition(function () {
      fun()
      setIsPending(false)
    })
  }] as const
}


export function useDeferredValue<T>(value: T) {
  const [local, setLocal] = useChange(value)
  useEffect(() => {
    startTransition(function () {
      setLocal(value)
    })
  }, [value])
  return local
}