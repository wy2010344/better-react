import { startTransition } from "better-react";
import { useChangeWith } from "./useState";
export function useTransition() {
  const [isPending, setIsPending] = useChangeWith(false)
  return [isPending, function (fun: () => void) {
    setIsPending(true)
    startTransition(function () {
      fun()
      setIsPending(false)
    })
  }] as const
}