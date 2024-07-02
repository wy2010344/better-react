import { renderMapF } from "better-react";

export function renderMax(
  max: number,
  getKey: (i: number) => any,
  render: (i: number) => void
) {
  renderMapF<number, void>(function (callback) {
    for (let i = 0; i < max; i++) {
      callback(undefined, i, getKey(i))
    }
  }, function (init, row, i) {
    render(row)
  })
}


export function renderMaxToMap<K, V>(
  max: number,
  getKey: (i: number) => K,
  render: (i: number) => V
) {
  const out = new Map<K, V>()
  renderMapF<number, V>(function (callback) {
    for (let i = 0; i < max; i++) {
      const k = getKey(i)
      const n = callback(undefined as unknown as V, i, k)
      out.set(k, n)
    }
  }, function (init, row, i) {
    return render(row)
  })
  return out
}
