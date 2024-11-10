import { renderForEach, RMap } from "better-react";
import { normalMapCreater } from "wy-helper";

export type ReadArray<T> = {
  length: number
  [index: number]: T
}
export function arrayHasValue(m: ReadArray<any>, i: number) {
  return i < m.length
}



export function renderArray<T, K>(
  vs: ReadArray<T>,
  getKey: (v: T, i: number) => K,
  render: (v: T, i: number) => void,
  creater: <F>() => RMap<K, F> = normalMapCreater
) {
  renderForEach(
    function (callback) {
      for (let i = 0; i < vs.length; i++) {
        const v = vs[i]
        callback(getKey(v, i), () => {
          render(v, i)
        })
      }
    }, creater)
}

export function renderArrayToMap<T, K, V>(
  vs: ReadArray<T>,
  getKey: (v: T, i: number) => K,
  render: (v: T, i: number) => V) {
  const out = new Map<K, V>()
  renderForEach(function (callback) {
    for (let i = 0; i < vs.length; i++) {
      const v = vs[i]
      const k = getKey(v, i)
      callback(k, () => {
        const m = render(v, i)
        out.set(k, m)
      })
    }
  })
  return out
}


export function renderArrayToArray<T, V>(
  vs: ReadArray<T>,
  getKey: (v: T, i: number) => any,
  render: (v: T, i: number) => V
) {
  const out: V[] = []
  renderForEach(function (callback) {
    for (let i = 0; i < vs.length; i++) {
      const v = vs[i]
      const k = getKey(v, i)
      callback(k, () => {
        const m = render(v, i)
        out.push(m)
      })
    }
  })
  return out
}

export function renderIterableIterator<V>(
  iterable: IterableIterator<V>,
  getKey: (value: V) => any,
  render: (value: V) => void
) {
  renderForEach(function (callback) {
    const it = iterable.next()
    while (!it.done) {
      callback(getKey(it.value), () => {
        render(it.value)
      })
    }
  })
}
export function renderIterableIteratorToMap<T, K, V>(
  iterable: IterableIterator<T>,
  getKey: (value: T) => K,
  render: (value: T) => V
) {
  const out = new Map<K, V>()
  renderForEach(function (callback) {
    const it = iterable.next()
    while (!it.done) {
      const k = getKey(it.value)
      callback(k, () => {
        const n = render(it.value)
        out.set(k, n)
      })
    }
  })
  return out
}

export function renderMap<K, V>(
  map: Map<K, V>,
  render: (value: V, key: K) => void
) {
  renderForEach(function (callback) {
    map.forEach(function (value, key) {
      callback(key, () => {
        render(value, key)
      })
    })
  })
}

export function renderSet<V>(
  set: Set<V>,
  render: (value: V) => void
) {
  renderForEach(function (callback) {
    set.forEach(function (key) {
      callback(key, () => {
        render(key)
      })
    })
  })
}

export function renderObject<V>(object: {
  [key: string]: V
}, render: (value: V, key: string) => void) {
  renderForEach(function (callback) {
    for (const key in object) {
      callback(key, () => {
        render(object[key], key)
      })
    }
  })
}