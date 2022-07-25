import { useEffect, useState } from "better-react"
import { useRefValue } from "./useRef"
export type NotifyHandler<T> = (v: T) => void

export class ValueCenter<T>{
  private pool: Set<NotifyHandler<T>> = new Set()
  private constructor(
    private value: T
  ) { }

  static of<T>(value: T) {
    return new ValueCenter(value)
  }
  get() {
    return this.value
  }
  set(value: T) {
    if (value != this.value) {
      this.value = value
      this.pool.forEach(notify => notify(value))
    }
  }
  add(notify: NotifyHandler<T>, call?: boolean) {
    if (!this.pool.has(notify)) {
      this.pool.add(notify)
      if (call) {
        notify(this.value)
      }
      return true
    }
    return false
  }
  remove(notify: NotifyHandler<T>) {
    return this.pool.delete(notify)
  }
}
/**
 * add this hooks so can render current component
 * @param store 
 */
export function useStoreTriggerRender<T>(store: ValueCenter<T>) {
  const [state, setState] = useState<T>(() => store.get())
  useEffect(function () {
    store.add(setState, true)
    return function () {
      store.remove(setState)
    }
  }, [store])
  return state
}


export function useRefValueCenterFrom<T>(fun: () => T) {
  return useRefValue(() => ValueCenter.of(fun())).get()
}
export function useRefValueCenter<T>(v: T) {
  return useRefValueCenterFrom(() => v)
}