import { renderOneF } from "better-react";
import { alawaysTrue } from "wy-helper";

export function renderOne<T>(key: T, render: (v: T) => void) {
  renderOneF(undefined, key, alawaysTrue, function (key) {
    return [key, undefined, alawaysTrue, function () {
      render(key)
    }, undefined]
  }, undefined)
}