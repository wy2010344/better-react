import { Translate, renderMapF } from "better-react";

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
export function renderMap<T>(
  vs: ReadArray<T>,
  getKey: (v: T, i: number) => any,
  render: (v: T, i: number) => void
) {
  renderMapF(undefined, vs, defaultTranslate, function (row, i) {
    return [getKey(row, i), undefined, function () {
      render(row, i)
    }]
  })
}