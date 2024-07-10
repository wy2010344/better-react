import { RMap } from 'better-react'
import { arrayEqual, simpleEqual } from 'wy-helper'


class ArrayMap<K, V> implements RMap<K, V> {
  constructor(
    private map: {
      key: any[],
      value: V
    }[] = [],
    private equal = simpleEqual
  ) { }
  private getArray(key: K) {
    if (Array.isArray(key)) {
      return key
    }
    return [key]
  }
  private getValue(key: any[]) {
    for (let i = 0; i < this.map.length; i++) {
      const kv = this.map[i]
      if (arrayEqual(kv.key, key, this.equal)) {
        return kv
      }
    }
  }
  get(key: K) {
    const keys = this.getArray(key)
    return this.getValue(keys)?.value
  }
  set(key: K, value: V) {
    const keys = this.getArray(key)
    const kv = this.getValue(keys)
    if (kv) {
      kv.value = value
    } else {
      this.map.push({
        key: keys,
        value
      })
    }
  }
  forEach(fun: (value: V, key: K) => void): void {
    this.map.forEach(function (item) {
      fun(item.value, item.key as any)
    })
  }
}



export function arrayOrOneMapCreater<K, V>() {
  return new ArrayMap<K, V>()
}