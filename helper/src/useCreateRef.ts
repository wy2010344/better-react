import { emptyArray, useLevelEffect } from "better-react";




export function useCreateRef<T>(node: T, setter: (v?: T) => void, level = 0) {
  useLevelEffect(level, function () {
    setter(node)
    return function () {
      setter(undefined)
    }
  }, emptyArray)
}