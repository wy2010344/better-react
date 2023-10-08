import { renderMapF } from "better-react";


function hasValueBase<C>(hasValue: (i: C) => any, i: C) {
  return hasValue(i)
}
export function renderHasValue<C>(
  initValue: C,
  hasValue: (i: C) => boolean,
  getNextValue: (v: C) => C,
  getKey: (i: C) => any,
  render: (i: C) => void
) {
  renderMapF(undefined, hasValue, initValue, hasValueBase, function (_, i) {
    return [getNextValue(i), getKey(i), undefined, function () {
      return render(i)
    }]
  })
}

export function renderMax(
  max: number,
  getKey: (i: number) => any,
  render: (i: number) => void
) {
  renderHasValue<number>(0, (i) => i < max, step, getKey, render)
}
function step(i: number) {
  return i + 1
}

