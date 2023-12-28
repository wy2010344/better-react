import { useLevelEffect } from "better-react";
import { emptyArray } from "wy-helper";




export function useCreateRef<T>(node: T, setter: (v?: T) => void, level = 0) {
  useLevelEffect(level, function () {
    setter(node)
    return function () {
      setter(undefined)
    }
  }, emptyArray)
}