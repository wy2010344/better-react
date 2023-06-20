import { useOneF } from "better-react";

export function useOne<T>(key: T, render: (v: T) => void) {
  useOneF(undefined, key, function (key) {
    return [key, undefined, function () {
      render(key)
    }]
  })
}