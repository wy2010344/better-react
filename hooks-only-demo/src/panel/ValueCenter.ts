import { useEffect, useState } from "../core"

export type NotifyHandler<T> = (v: T) => void

/**
 * 用ValueCenter作为Context
 * ValueCenter变化,Context不会通知给子节点,即不会使子节点变脏
 * 即不会触发render
 * 
 * 即回写到兄弟节点
 * 始终要弄脏某个父节点
 * 即导致回流
 * 
 * 因为react是深度遍历的,
 * 其实广度也一样
 * 弟应该依赖兄节点的参数,而不只是父节点的参数
 * 
 * 
 * 以上都不对
 * 是过早提交变更,造成effectTag被清理
 * 
 * 兄传弟,显式、顺序地用返回参数传递,而不是context
 * 
 * 代码实现Portal必然的失败
 * 因为总会在局部引用state,修改state引发自render,而造成死循环
 */
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
    this.value = value
    this.pool.forEach(notify => notify(value))
  }
  add(notify: NotifyHandler<T>) {
    if (!this.pool.has(notify)) {
      this.pool.add(notify)
      notify(this.value)
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
  const [state, setState] = useState<T>(store.get())
  useEffect(function () {
    store.add(setState)
    return function () {
      store.remove(setState)
    }
  }, [store])
  return state
}