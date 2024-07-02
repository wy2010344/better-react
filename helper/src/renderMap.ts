import { ReduceData, renderMapF } from "better-react";
import { alawaysTrue } from "wy-helper";

export type ReadArray<T> = {
  length: number
  [index: number]: T
}
export function arrayHasValue(m: ReadArray<any>, i: number) {
  return i < m.length
}



class ArrayReduceData<T> implements ReduceData<T> {
  constructor(
    private array: ReadArray<T>,
    private index: number
  ) { }
  value = this.array[this.index]
  getNext(): ReduceData<T> | undefined {
    const nextIndex = this.index + 1
    if (nextIndex < this.array.length) {
      return new ArrayReduceData(this.array, nextIndex)
    }
  }
  static from<T>(array: ReadArray<T>) {
    if (array.length) {
      return new ArrayReduceData(array, 0)
    }
    return undefined
  }
}

export function renderArray<T>(
  vs: ReadArray<T>,
  getKey: (v: T, i: number) => any,
  render: (v: T, i: number) => void,
) {
  renderMapF(ArrayReduceData.from(vs), getKey, function (old, value, index) {
    render(value, index)
    return undefined
  }, undefined)
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

/**
 * 因为iterator本身是不完美的无副作用的.
 */
class IterableReduceData<T> implements ReduceData<T> {
  constructor(
    public readonly value: T,
    private iterator: IterableIterator<T>
  ) { }
  getNext(): ReduceData<T> | undefined {
    const n = this.iterator.next()
    if (!n.done) {
      return new IterableReduceData<T>(n.value, this.iterator)
    }
  }
  static from<T>(value: IterableIterator<T>) {
    const n = value.next()
    if (!n.done) {
      return new IterableReduceData<T>(n.value, value)
    }
  }
}

export function renderIterableIterator<V>(
  iterable: IterableIterator<V>,
  getKey: (value: V) => any,
  render: (value: V, index: number) => void) {
  renderMapF(IterableReduceData.from(iterable), getKey, function (old, value, index) {
    render(value, index)
    return undefined
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