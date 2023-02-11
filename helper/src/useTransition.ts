import { startTransition, useState } from "better-react";




export function useTransition() {
  const [isPending, setIsPending] = useState(false)

  return [isPending, function (fun: () => void) {
    setIsPending(true)
    startTransition(function () {
      fun()
      setIsPending(false)
    })
  }] as const
}