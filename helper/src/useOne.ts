import { useOneF } from "better-react";

export function useOne<T>(key: T, render: (v: T) => void) {
  useOneF(key, function (key) {
    return [key, function () {
      render(key)
    }]
  })
}