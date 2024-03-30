import { FiberConfig, UseAfterRenderMap, renderMapF } from "better-react";
import { alawaysTrue } from "wy-helper";


function hasValueBase<C>(hasValue: (i: C) => any, i: C) {
  return hasValue(i)
}
export function renderHasValue<C>(
  useAfterRender: UseAfterRenderMap,
  initValue: C,
  hasValue: (i: C) => boolean,
  getNextValue: (v: C) => C,
  getKey: (i: C) => any,
  getConfig: (i: C) => FiberConfig,
  render: (i: C) => void
) {
  renderMapF(hasValue, initValue, hasValueBase, useAfterRender, alawaysTrue, function (_, i) {
    return [getNextValue(i), getKey(i), getConfig(i), alawaysTrue, function () {
      return render(i)
    }, undefined]
  }, undefined)
}

export function renderMax(
  useAfterRender: UseAfterRenderMap,
  max: number,
  getKey: (i: number) => any,
  getConfig: (i: number) => FiberConfig,
  render: (i: number) => void
) {
  renderHasValue<number>(useAfterRender, 0, (i) => i < max, step, getKey, getConfig, render)
}
function step(i: number) {
  return i + 1
}

