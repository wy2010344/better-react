import { StateHolder } from './stateHolder'
import {
  quote,
  simpleNotEqual,
  ValueCenter,
  valueCenterOf,
  emptyArray,
  arraySimpleNotEqual,
  ValueCenterDefaultImpl,
  alawaysFalse,
} from 'wy-helper'
import { hookEnvModel, hookStateHoder } from './cache'
import { useLevelEffect } from './effect'
import { useBaseMemo } from './memo'

export interface Context<T> {
  useProvider(v: T): void
  /**
   * 似乎不能hookSelector,因为transition中闪建的节点,
   * @param getValue
   * @param shouldUpdate
   */
  useSelector<M>(
    getValue: (v: T) => M,
    shouldUpdate?: (a: M, b: M) => boolean,
  ): M
  useConsumer(): T
}
export function createContext<T>(v: T): Context<T> {
  return new ContextFactory(v)
}
class ContextFactory<T> implements Context<T> {
  constructor(public readonly out: T) {
    this.defaultContext = valueCenterOf(out)
  }

  private readonly defaultContext: ValueCenterDefaultImpl<T>
  useProvider(v: T) {
    const holder = hookStateHoder()
    if (holder.firstTime) {
      holder.contexts = holder.contexts || []
      holder.contexts.push({
        key: this,
        value: valueCenterOf(v),
      })
      holder.contextIndex = holder.contextIndex + 1
    } else {
      const providers = holder.contexts
      if (!providers) {
        throw new Error('原组件上不存在providers')
      }
      const index = holder.contextIndex
      const provider = providers[index]
      if (!provider) {
        throw new Error('原组件上不存在provider')
      }
      holder.contextIndex = index + 1
      if (provider.key != this) {
        throw new Error('原组件上provider不对应')
      }
      // 每次render都会走到这里,值没变时不要通知,否则会与"渲染中断重放"互相触发
      if (simpleNotEqual(provider.value.get(), v)) {
        provider.value.set(v)
      }
    }
  }
  private findProviderStateHoder(_holder: StateHolder) {
    let begin = _holder.contexts?.length || 0
    let holder: StateHolder | undefined = _holder
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
  useSelector<M>(
    getValue: (v: T) => M,
    shouldUpdate: (a: M, b: M) => any = simpleNotEqual,
  ): M {
    const holder = hookStateHoder()
    const provider = this.findProviderStateHoder(holder)
    const env = hookEnvModel()
    let context: ValueCenter<T> = this.defaultContext
    let notSelf = true
    if (provider) {
      context = provider[1]
      notSelf = provider[0].fiber != holder.fiber
    }
    const thisValue = getValue(context.get())
    // 订阅闭包只会创建一次,比较基准必须每帧更新,
    // 否则闭包里的旧值会让 A→B→A 的第二次变化被判定为"没变"
    const lastValue = useBaseMemo(
      alawaysFalse,
      () => ({ current: thisValue }),
      undefined,
    )
    lastValue.current = thisValue
    const appState = env.appState
    useLevelEffect(
      0,
      arraySimpleNotEqual,
      function () {
        return [
          undefined,
          context.subscribe(function (value) {
            const m = getValue(value)
            if (!notSelf || !shouldUpdate(lastValue.current, m)) {
              return
            }
            const schedule = function () {
              if (holder.destroyed) {
                return
              }
              appState.reconcile(function (freshEnv) {
                if (holder.destroyed) {
                  return
                }
                if (shouldUpdate(lastValue.current, getValue(context.get()))) {
                  holder.fiber.effectTag.set(freshEnv, 'UPDATE')
                }
              })
            }
            // provider 在 render 期间 set 会同步通知到这里,
            // 此时直接调度会被判定为"渲染中断",调度器丢弃当前env并重放,
            // 而重放时 provider 若传入新对象会再次通知,形成无限循环。
            // 所以把调度推迟到当前env提交之后,保证每次通知只产生一轮更新。
            const renderEnv = hookEnvModel()
            if (renderEnv) {
              renderEnv.commitChange(schedule)
            } else {
              schedule()
            }
          }),
        ]
      },
      [context, getValue, shouldUpdate, notSelf],
    )
    return thisValue
  }

  /**
   * 延迟,动态在函数中去获取
   * @param holder
   * @returns
   */
  getFromHolder(holder: StateHolder): T {
    const provider = this.findProviderStateHoder(holder)
    if (provider) {
      return provider[1].get()
    }
    return this.defaultContext.get()
  }
}
