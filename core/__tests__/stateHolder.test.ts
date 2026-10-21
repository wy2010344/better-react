import { describe, it, expect } from 'vitest'
import { alawaysFalse } from 'wy-helper'
import { renderStateHolder } from '../src/stateHolder'
import { useLevelEffect } from '../src/effect'
import { createTestRoot } from './harness'

describe('renderStateHolder', () => {
  it('卸载时能销毁内部 scope 的 effect', () => {
    const events: string[] = []

    function App() {
      renderStateHolder(function () {
        useLevelEffect(
          0,
          alawaysFalse,
          function () {
            events.push('mount')
            return [
              undefined,
              function () {
                events.push('unmount')
              },
            ] as [undefined, () => void]
          },
          undefined,
        )
      })
    }

    const destroy = createTestRoot(function () {
      App()
    })
    expect(events).toEqual(['mount'])

    destroy()
    expect(events).toEqual(['mount', 'unmount'])
  })
})
