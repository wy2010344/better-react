import { useLevelEffect } from "better-react";
import { alawaysFalse } from "wy-helper";




export function useCreateRef<T>(node: T, setter: (v?: T) => void, level = 0) {
  useLevelEffect(level, alawaysFalse, function () {
    setter(node)
    return [undefined, function () {
      setter(undefined)
    }]
  }, undefined)
}