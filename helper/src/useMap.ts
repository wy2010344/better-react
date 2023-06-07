import { Translate, useMapF } from "better-react";

export type ReadArray<T> = {
  length: number
  [index: number]: T
}
export const defaultTranslate: Translate<ReadArray<any>, any> = {
  size(m) {
    return m.length
  },
  get(m, i) {
    return m[i]
  },
}
export function useMap<T>(
  vs: ReadArray<T>,
  getKey: (v: T) => any,
  render: (v: T, i: number) => void
) {
  useMapF(undefined, vs, defaultTranslate, function (row, i) {
    return [getKey(row), function () {
      render(row, i)
    }]
  })
}