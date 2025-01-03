
import { StateHolder } from "./stateHolder";
import { quote, simpleNotEqual, ValueCenter, valueCenterOf, emptyArray, arrayEqual, simpleEqual, arraySimpleNotEqual } from "wy-helper";
import { hookStateHoder } from "./cache";
import { useLevelEffect } from "./effect";


export interface Context<T> {
  useProvider(v: T): void
  /**
   * 似乎不能hookSelector,因为transition中闪建的节点,
   * @param getValue 
   * @param shouldUpdate 
   */
  useSelector<M>(getValue: (v: T) => M, shouldUpdate?: (a: M, b: M) => boolean): M
  useConsumer(): T
}
export function createContext<T>(v: T): Context<T> {
  return new ContextFactory(v)
}
class ContextFactory<T> implements Context<T> {
  constructor(
    public readonly out: T
  ) {
    this.defaultContext = valueCenterOf(out)
  }

  private readonly defaultContext: ValueCenter<T>
  useProvider(v: T) {
    const holder = hookStateHoder()
    if (holder.firstTime) {
      holder.contexts = holder.contexts || []
      holder.contexts.push({
        key: this,
        value: valueCenterOf(v)
      })
      holder.contextIndex = holder.contextIndex + 1
    } else {
      const providers = holder.contexts
      if (!providers) {
        throw new Error("原组件上不存在providers")
      }
      const index = holder.contextIndex
      const provider = providers[index]
      if (!provider) {
        throw new Error("原组件上不存在provider")
      }
      holder.contextIndex = index + 1
      if (provider.key != this) {
        throw new Error("原组件上provider不对应")
      }
      provider.value.set(v)
    }
  }
  private findProviderStateHoder(holder: StateHolder) {
    let begin = holder.contexts?.length || 0
    while (holder) {
      const providers = holder.contexts || emptyArray
      for (let i = begin - 1; i > -1; i--) {
        const provider = providers[i]
        if (provider.key == this) {
          return [holder, provider.value] as const
        }
      }
      begin = holder.parentContextIndex
      holder = holder.parent
    }
  }
  useConsumer() {
    return this.useSelector(quote)
  }

  /**
   * 可能context没有改变,但本地render已经发生,
   * 每次render都要注册事件,也要销毁前一次注册的事件.必然要在fiber上记忆.
   * 
   * 每次执行都去重新定位,每次render指定到下一次.不能变成hook.因为先render而后通知,没有取消通知
   * @param getValue 
   * @param shouldUpdate 
   * @returns 
   */
  useSelector<M>(getValue: (v: T) => M, shouldUpdate: (a: M, b: M) => any = simpleNotEqual): M {
    const holder = hookStateHoder()
    const provider = this.findProviderStateHoder(holder)
    let context: ValueCenter<T> = this.defaultContext
    let notSelf = true
    if (provider) {
      context = provider[1]
      notSelf = provider[0].fiber != holder.fiber
    }
    const thisValue = getValue(context.get())
    useLevelEffect(0, arraySimpleNotEqual, function () {
      return [undefined, context.subscribe(function (value) {
        const m = getValue(value)
        if (notSelf && shouldUpdate(thisValue, m)) {
          holder.fiber.effectTag.set("UPDATE")
        }
      })]
    }, [context, getValue, shouldUpdate, notSelf])
    return thisValue
  }
}
