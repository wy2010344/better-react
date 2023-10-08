import { quote, renderMapF } from "better-react";

export type ReadArray<T> = {
  length: number
  [index: number]: T
}
export function arrayHasValue(m: ReadArray<any>, i: number) {
  return i < m.length
}
export function renderArray<T>(
  vs: ReadArray<T>,
  getKey: (v: T, i: number) => any,
  render: (v: T, i: number) => void
) {
  renderMapF(undefined, vs, 0 as number, arrayHasValue, function (data, i) {
    const row = data[i]
    return [i + 1, getKey(row, i), undefined, function () {
      render(row, i)
    }]
  })
}


function iterableHasValue<T>(m: IterableIterator<T>, v: IteratorResult<T, any>) {
  return !v.done
}
export function renderIterableIterator<V>(
  iterable: IterableIterator<V>,
  getKey: (value: V) => any,
  render: (value: V) => void
) {
  renderMapF(undefined, iterable, iterable.next(), iterableHasValue, function (iterable, i) {
    return [iterable.next(), getKey(i.value), undefined, function () {
      return render(i.value)
    }]
  })
}

function getMapEntityKey<K, V>(kv: [K, V]) {
  return kv[0]
}
export function renderMap<K, V>(
  map: Map<K, V>,
  render: (value: V, key: K) => void
) {
  renderIterableIterator(map.entries(), getMapEntityKey, function (row) {
    render(row[1], row[0])
  })
}

export function renderSet<V>(
  set: Set<V>,
  render: (value: V) => void
) {
  renderIterableIterator(set.entries(), getMapEntityKey, function (row) {
    render(row[0])
  })
}

export function renderObject<V>(
  object: {
    [key: string]: V
  },
  render: (value: V, key: string) => void
) {
  renderArray(Object.entries(object), getMapEntityKey, function (row) {
    render(row[1], row[0])
  })
}