import { describe, it, expect } from 'vitest'
import { renderIterableIterator, renderIterableIteratorToMap } from '../src/renderMap'
import { createTestRoot } from '../../core/__tests__/harness'

/**
 * 迭代器每次只能前进一次。旧实现只在循环外调用了 next(),
 * 导致死循环,这里用「重复 key」直接暴露问题,避免测试卡死。
 */
describe('renderIterableIterator', () => {
  it('逐个推进迭代器,而不是反复渲染同一个值', () => {
    const seen: number[] = []
    let last: number | undefined

    const destroy = createTestRoot(function () {
      renderIterableIterator(
        new Set([1, 2, 3]).values(),
        (v) => v,
        (v) => {
          if (v === last) {
            throw new Error('迭代器没有推进')
          }
          last = v
          seen.push(v)
        },
      )
    })

    expect(seen).toEqual([1, 2, 3])
    destroy()
  })

  it('renderIterableIteratorToMap 同样逐个推进', () => {
    const seen: number[] = []
    let last: number | undefined

    const destroy = createTestRoot(function () {
      renderIterableIteratorToMap(
        new Set([4, 5]).values(),
        (v) => v,
        (v) => {
          if (v === last) {
            throw new Error('迭代器没有推进')
          }
          last = v
          seen.push(v)
        },
      )
    })

    expect(seen).toEqual([4, 5])
    destroy()
  })
})
