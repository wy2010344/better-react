import { renderMapF } from "better-react";

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
  render: (v: T, i: number) => void,
) {
  renderMapF<T, void>(
    function (callback) {
      for (let i = 0; i < vs.length; i++) {
        const v = vs[i]
        callback(undefined, v, getKey(v, i))
      }
    },
    function (init, row, i) {
      render(row, i)
    })
}

export function renderArrayToMap<T, K, V>(
  vs: ReadArray<T>,
  getKey: (v: T, i: number) => K,
  render: (v: T, i: number) => V) {
  const out = new Map<K, V>()
  renderMapF<T, V>(function (callback) {
    for (let i = 0; i < vs.length; i++) {
      const v = vs[i]
      const k = getKey(v, i)
      const m = callback(undefined as unknown as V, v, k)
      out.set(k, m)
    }
  }, function (init, row, i) {
    return render(row, i)
  })
  return out
}


export function renderArrayToArray<T, V>(
  vs: ReadArray<T>,
  getKey: (v: T, i: number) => any,
  render: (v: T, i: number) => V
) {
  const out: V[] = []
  renderMapF<T, V>(function (callback) {
    for (let i = 0; i < vs.length; i++) {
      const v = vs[i]
      const k = getKey(v, i)
      const m = callback(undefined as unknown as V, v, k)
      out.push(m)
    }
  }, function (init, row, i) {
    return render(row, i)
  })
  return out
}

export function renderIterableIterator<V>(
  iterable: IterableIterator<V>,
  getKey: (value: V) => any,
  render: (value: V, index: number) => void
) {
  renderMapF<V, void>(function (callback) {
    const it = iterable.next()
    while (!it.done) {
      callback(undefined, it.value, getKey(it.value))
    }
  }, function (init, row, i) {
    render(row, i)
  })
}
export function renderIterableIteratorToMap<T, K, V>(
  iterable: IterableIterator<T>,
  getKey: (value: T) => K,
  render: (value: T, index: number) => V
) {
  const out = new Map<K, V>()
  renderMapF<T, V>(function (callback) {
    const it = iterable.next()
    while (!it.done) {
      const k = getKey(it.value)
      const n = callback(undefined as unknown as V, it.value, k)
      out.set(k, n)
    }
  }, function (init, row, i) {
    return render(row, i)
  })
  return out
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

export function renderObject<V>(object: {
  [key: string]: V
}, render: (value: V, key: string) => void) {
  renderArray(Object.entries(object), getMapEntityKey, function (row) {
    render(row[1], row[0])
  })
}