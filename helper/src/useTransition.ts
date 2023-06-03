import { startTransition } from "better-react";
import { useChange } from "./useState";
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