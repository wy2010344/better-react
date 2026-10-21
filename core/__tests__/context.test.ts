import { describe, it, expect } from 'vitest'
import { alawaysFalse, alawaysTrue } from 'wy-helper'
import { createContext } from '../src/context'
import { startTransition } from '../src/reconcile'
import { renderFiber } from '../src/fc'
import { hookRequestReconcile } from '../src/requestFresh'
import { createTestRoot } from './harness'

describe('context useSelector', () => {
  it('provider 值变化时通知消费者,并且 A→B→A 也能再次更新', () => {
    const ThemeContext = createContext('light')
    const seen: string[] = []
    let theme = 'light'
    let update!: (v: string) => void

    function App() {
      const request = hookRequestReconcile()
      update = function (v) {
        theme = v
        request(alawaysTrue)
      }
      ThemeContext.useProvider(theme)
      // 子 fiber 才是消费者,覆盖 notSelf 分支
      renderFiber(
        alawaysFalse,
        function () {
          seen.push(ThemeContext.useConsumer())
        },
        undefined,
      )
    }

    const destroy = createTestRoot(function () {
      App()
    })
    expect(seen).toEqual(['light'])

    update('dark')
    expect(seen).toEqual(['light', 'dark'])

    // 回到初始值:旧实现用闭包里的首次渲染值比较,这里会漏掉更新
    update('light')
    expect(seen).toEqual(['light', 'dark', 'light'])

    destroy()
  })

  it('provider 每次渲染传入新对象时不会无限重渲染', () => {
    const BoxContext = createContext({ value: 0 })
    const seen: number[] = []
    let value = 0
    let update!: (v: number) => void

    function App() {
      const request = hookRequestReconcile()
      update = function (v) {
        value = v
        request(alawaysTrue)
      }
      // 每次 render 都会构造新对象
      BoxContext.useProvider({ value })
      renderFiber(
        alawaysFalse,
        function () {
          seen.push(BoxContext.useSelector((v) => v.value))
        },
        undefined,
      )
    }

    const destroy = createTestRoot(function () {
      App()
    })
    expect(seen).toEqual([0])

    update(1)
    expect(seen).toEqual([0, 1])

    destroy()
  })

  it('consumer 直接使用对象值时也不会无限重渲染', () => {
    const BoxContext = createContext({ value: 0 })
    const seen: number[] = []
    let value = 0
    let update!: (v: number) => void

    function App() {
      const request = hookRequestReconcile()
      update = function (v) {
        value = v
        request(alawaysTrue)
      }
      BoxContext.useProvider({ value })
      renderFiber(
        alawaysFalse,
        function () {
          seen.push(BoxContext.useConsumer().value)
        },
        undefined,
      )
    }

    const destroy = createTestRoot(function () {
      App()
    })
    expect(seen).toEqual([0])

    update(1)
    expect(seen).toEqual([0, 1])

    destroy()
  })

  it('transition 中的更新也能传递到消费者', () => {
    const ThemeContext = createContext('light')
    const seen: string[] = []
    let theme = 'light'
    let update!: (v: string) => void

    function App() {
      const request = hookRequestReconcile()
      update = function (v) {
        theme = v
        request(alawaysTrue)
      }
      ThemeContext.useProvider(theme)
      renderFiber(
        alawaysFalse,
        function () {
          seen.push(ThemeContext.useConsumer())
        },
        undefined,
      )
    }

    const destroy = createTestRoot(function () {
      App()
    })
    expect(seen).toEqual(['light'])

    // 低优先级渲染中 provider 同样会 set,调度被推迟到提交后
    startTransition(() => update('dark'))
    expect(seen).toEqual(['light', 'dark'])

    destroy()
  })
})
