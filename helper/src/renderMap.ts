import { renderMapF } from "better-react";
import { alawaysTrue } from "wy-helper";

export type ReadArray<T> = {
  length: number
  [index: number]: T
}
export function arrayHasValue(m: ReadArray<any>, i: number) {
  return i < m.length
}

export function createRenderMapF<M, C>(
  hasValue: (v: M, c: C) => any,
  getNext: (v: M, c: C) => C,
  getKey: (v: M, c: C) => any,
) {
  return function (data: M, initCache: C, render: (v: M, c: C) => void) {
    return renderMapF(data, initCache, hasValue, alawaysTrue, function (row, c) {
      return [getNext(row, c), getKey(row, c), alawaysTrue, function () {
        render(row, c)
      }, undefined]
    }, undefined)
  }
}

export function renderArray(
  vs: ReadArray<any>,
  getKey: (v: any, i: number) => any,
  render: (v: any, i: number) => void,
  portal?: boolean
) {
  const it = renderMapF(vs, 0 as number, arrayHasValue, alawaysTrue, function (data, i) {
    const row = data[i]
    return [i + 1, getKey(row, i), alawaysTrue, function () {
      render(row, i)
    }, undefined]
  }, undefined)
  if (portal) {
    return it
  }
}

export function createRenderArray<T>(
  getKey: (v: T, i: number) => any,
  render: (v: T, i: number) => void
): (vs: ReadArray<T>) => void
export function createRenderArray<T>(
  getKey: (v: T, i: number) => any,
): (vs: ReadArray<T>, render: (v: T, i: number) => void) => void
export function createRenderArray(
  getKey: (v: any, i: number) => any,
  superRender?: any
) {
  return function (vs: ReadArray<any>, render = superRender) {
    return renderArray(vs, getKey, render)
  }
}

function iterableHasValue<T>(m: IterableIterator<T>, v: IteratorResult<T, any>) {
  return !v.done
}

export function renderIterableIterator<V>(
  iterable: IterableIterator<V>,
  getKey: (value: V) => any,
  render: (value: V) => void) {
  renderMapF(iterable, iterable.next(), iterableHasValue, alawaysTrue, function (iterable, i) {
    return [iterable.next(), getKey(i.value), alawaysTrue, function () {
      return render(i.value)
    }, undefined]
  }, undefined)
}

function getMapEntityKey<K, V>(kv: [K, V]) {
  return kv[0]
}

export function renderMap<K, V>(
  map: Map<K, V>,
  render: (value: V, key: K) => void
) {
  return renderIterableIterator(map.entries(), getMapEntityKey, function (row) {
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

export type RenderKeyArray = <T>(vs: ReadArray<T>, getKey: (v: T) => any, render: (v: T, i: number) => void) => void
export function createRenderObject<V>(
  renderArray: RenderKeyArray
) {
  return function (
    object: {
      [key: string]: V
    },
    render: (value: V, key: string) => void
  ) {
    renderArray(Object.entries(object), getMapEntityKey, function (row) {
      render(row[1], row[0])
    })
  }
}

export const renderObject = createRenderObject(renderArray) as <V>(
  object: {
    [key: string]: V
  },
  render: (value: V, key: string) => void
) => void