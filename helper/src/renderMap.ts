import { FiberConfig, UseAfterRenderMap, renderMapF } from "better-react";
import { alawaysTrue, quote } from "wy-helper";
import { fiberConfigAlawaysAllowGet } from "./util";

export type ReadArray<T> = {
  length: number
  [index: number]: T
}
export function arrayHasValue(m: ReadArray<any>, i: number) {
  return i < m.length
}

export function createRenderMapF<M, C>(
  useAfterRender: UseAfterRenderMap,
  hasValue: (v: M, c: C) => any,
  getNext: (v: M, c: C) => C,
  getKey: (v: M, c: C) => any,
  getConfig: (v: M, c: C) => FiberConfig
) {
  return function (data: M, initCache: C, render: (v: M, c: C) => void) {
    return renderMapF(data, initCache, hasValue, useAfterRender, alawaysTrue, function (row, c) {
      return [getNext(row, c), getKey(row, c), getConfig(row, c), alawaysTrue, function () {
        render(row, c)
      }, undefined]
    }, undefined)
  }
}

export function createBaseRenderArray<T>(
  useAfterRender: UseAfterRenderMap,
  getConfig: (v: T, i: number) => FiberConfig
) {
  return function (
    vs: ReadArray<any>,
    getKey: (v: any, i: number) => any,
    render: (v: any, i: number) => void
  ) {
    renderMapF(vs, 0 as number, arrayHasValue, useAfterRender, alawaysTrue, function (data, i) {
      const row = data[i]
      return [i + 1, getKey(row, i), getConfig(row, i), alawaysTrue, function () {
        render(row, i)
      }, undefined]
    }, undefined)
  }
}

export function createRenderArray<T>(
  useAfterRender: UseAfterRenderMap,
  getConfig: (v: T, i: number) => FiberConfig,
  getKey: (v: T, i: number) => any,
  render: (v: T, i: number) => void
): (vs: ReadArray<T>) => void
export function createRenderArray<T>(
  useAfterRender: UseAfterRenderMap,
  getConfig: (v: T, i: number) => FiberConfig,
  getKey: (v: T, i: number) => any,
): (vs: ReadArray<T>, render: (v: T, i: number) => void) => void
export function createRenderArray(
  useAfterRender: UseAfterRenderMap,
  getConfig: (v: any, i: number) => FiberConfig,
  getKey: (v: any, i: number) => any,
  superRender?: any
) {
  const ra = createBaseRenderArray(useAfterRender, getConfig)
  return function (vs: ReadArray<any>, render = superRender) {
    return ra(vs, getKey, render)
  }
}

export const renderArray = createBaseRenderArray(quote, fiberConfigAlawaysAllowGet)


function iterableHasValue<T>(m: IterableIterator<T>, v: IteratorResult<T, any>) {
  return !v.done
}

export function renderIterableIterator<V>(
  useAfterRender: UseAfterRenderMap,
  iterable: IterableIterator<V>,
  getKey: (value: V) => any,
  getConfig: (v: V,) => FiberConfig,
  render: (value: V) => void
) {
  renderMapF(iterable, iterable.next(), iterableHasValue, useAfterRender, alawaysTrue, function (iterable, i) {
    return [iterable.next(), getKey(i.value), getConfig(i.value), alawaysTrue, function () {
      return render(i.value)
    }, undefined]
  }, undefined)
}


export function createRenderIterableIterator<V>(
  useAfterRender: UseAfterRenderMap,
  getConfig: (v: V,) => FiberConfig,
  getKey: (value: V) => any,
  render: (value: V) => void
): (iterable: IterableIterator<V>) => void
export function createRenderIterableIterator<V>(
  useAfterRender: UseAfterRenderMap,
  getConfig: (v: V,) => FiberConfig,
  getKey: (value: V) => any
): (
  vs: IterableIterator<V>,
  render: (value: V
  ) => void) => void
export function createRenderIterableIterator(
  useAfterRender: UseAfterRenderMap,
  getConfig: (v: any) => FiberConfig, getKey: any, superRender?: any) {
  return function (vs: IterableIterator<any>, render = superRender) {
    return renderIterableIterator(useAfterRender, vs, getKey, getConfig, render)
  }
}



function getMapEntityKey<K, V>(kv: [K, V]) {
  return kv[0]
}

export function renderMap<K, V>(
  useAfterRender: UseAfterRenderMap,
  getConfig: (v: [K, V]) => FiberConfig,
  map: Map<K, V>,
  render: (value: V, key: K) => void
) {
  renderIterableIterator(useAfterRender, map.entries(), getMapEntityKey, getConfig, function (row) {
    render(row[1], row[0])
  })
}

export function renderSet<V>(
  useAfterRender: UseAfterRenderMap,
  getConfig: (v: [V, V]) => FiberConfig,
  set: Set<V>,
  render: (value: V) => void
) {
  renderIterableIterator(useAfterRender, set.entries(), getMapEntityKey, getConfig, function (row) {
    render(row[0])
  })
}


export type RenderKeyArray<T> = (vs: ReadArray<T>, getKey: (v: T) => any, render: (v: T, i: number) => void) => void
export function buildRenderObject<V>(
  renderArray: RenderKeyArray<[string, V]>
) {
  return function (
    object: {
      [key: string]: V
    },
    render: (value: V, key: string) => void
  ) {
    return renderArray(Object.entries(object), getMapEntityKey, function (row) {
      render(row[1], row[0])
    })
  }
}