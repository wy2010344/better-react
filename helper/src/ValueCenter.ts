import { useEffect, useMemo, useState } from "better-react"
import { useRefValue } from "./useRef"
export type NotifyHandler = () => void
export interface VirtualValueCenter<T> {
  get(): T
  set(v: T): void
  add(notify: NotifyHandler, call?: boolean): boolean
  remove(notify: NotifyHandler): boolean
  subscribe(notify: NotifyHandler, call?: boolean): () => void
}

export class ValueCenter<T> implements VirtualValueCenter<T>{
  private pool: Set<NotifyHandler> = new Set()
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
      this.pool.forEach(notify => notify())
    }
  }
  add(notify: NotifyHandler, call?: boolean) {
    if (!this.pool.has(notify)) {
      this.pool.add(notify)
      if (call) {
        notify()
      }
      return true
    }
    return false
  }
  remove(notify: NotifyHandler) {
    return this.pool.delete(notify)
  }

  subscribe(notify: NotifyHandler, call?: boolean) {
    const that = this
    that.add(notify, call)
    return function () {
      that.remove(notify)
    }
  }
}

type PartBuilder<PARENT, CHILD> = {
  store: VirtualValueCenter<PARENT>
  getChild: (s: PARENT) => CHILD,
  buildParent: (s: PARENT, t: CHILD) => PARENT
}

export class PartValueCenter<T> implements VirtualValueCenter<T>{
  constructor(
    private builder: PartBuilder<any, T>
  ) { }
  get(): T {
    return this.builder.getChild(this.builder.store.get())
  }
  set(v: T): void {
    this.builder.store.set(this.builder.buildParent(this.builder.store.get(), v))
  }
  add(notify: NotifyHandler, call?: boolean | undefined): boolean {
    return this.builder.store.add(notify, call)
  }
  remove(notify: NotifyHandler): boolean {
    return this.builder.store.remove(notify)
  }
  subscribe(notify: NotifyHandler, call?: boolean | undefined): () => void {
    return this.builder.store.subscribe(notify, call)
  }
  static of<PARENT, CHILD>(
    store: VirtualValueCenter<PARENT>,
    getChild: (s: PARENT) => CHILD,
    buildParent: (s: PARENT, t: CHILD) => PARENT
  ) {
    return new PartValueCenter({ store, getChild, buildParent })
  }
  static objectOf<PARENT extends object, K extends keyof PARENT>(
    store: VirtualValueCenter<PARENT>,
    key: K,
    callback?: (v: PARENT[K], parent: PARENT) => PARENT[K]
  ) {
    const arg: PartBuilder<PARENT, PARENT[K]> = {
      store,
      getChild(s) {
        return s[key]
      },
      buildParent(s, t) {
        return {
          ...s,
          [key]: callback ? callback(t, s) : t
        }
      },
    }
    return new PartValueCenter(arg)
  }
}

export class ArrayPartValueCenter<T> implements VirtualValueCenter<T>{
  constructor(
    private store: VirtualValueCenter<T[]>,
    private equal: (v: T) => boolean
  ) { }
  get(): T {
    return this.store.get().find(this.equal)!
  }
  set(v: T): void {
    const idx = this.store.get().findIndex(this.equal)
    if (idx < 0) {
      return
    }
    const vs = this.store.get().slice()
    vs.splice(idx, 1, v)
    this.store.set(vs)
  }
  clear() {
    const idx = this.store.get().findIndex(this.equal)
    if (idx < 0) {
      return
    }
    const vs = this.store.get().slice()
    vs.splice(idx, 1)
    this.store.set(vs)
  }
  add(notify: NotifyHandler, call?: boolean | undefined): boolean {
    return this.store.add(notify, call)
  }
  remove(notify: NotifyHandler): boolean {
    return this.store.remove(notify)
  }
  subscribe(notify: NotifyHandler, call?: boolean | undefined): () => void {
    return this.store.subscribe(notify, call)
  }
}

/**
 * add this hooks so can render current component
 * @param store 
 */
export function useStoreTriggerRender<T>(store: VirtualValueCenter<T>) {
  const [state, setState] = useState<T>(store.get())
  useEffect(function () {
    return store.subscribe(function () {
      setState(store.get())
    }, true)
  }, [store])
  return state
}

export function useValueCenterState<T>(store: VirtualValueCenter<T>) {
  const state = useStoreTriggerRender(store)
  const setState = useMemo(() => {
    return (v: T | ((before: T) => T)) => {
      if (typeof (v) == 'function') {
        store.set((v as any)(store.get()))
      } else {
        store.set(v)
      }
    }
  }, [store])
  return [state, setState, store] as const
}
export function useRefValueCenterFrom<T>(fun: () => T) {
  return useRefValue(() => ValueCenter.of(fun())).get()
}
export function useRefValueCenter<T>(v: T) {
  return useRefValueCenterFrom(() => v)
}