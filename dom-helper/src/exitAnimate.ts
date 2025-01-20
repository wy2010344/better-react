import { useMemo, useRef } from "better-react-helper"
import { ExitModel, emptyArray } from "wy-helper"
import { renderIf, useEffect, renderKeyArray } from 'better-react-helper'
import { hookAddResult } from "better-react"
export type ExitArrayCloneOut<T extends Node> = {
  node: T,
  applyAnimate(node: T, value: ExitModel<any>): void
}
export type ExitArrayCloneOutList = (ExitArrayCloneOut<Node> | {
  call?(): void
  list: readonly ExitArrayCloneOut<Node>[]
}) & {
  value: ExitModel<any>
}
export function renderExitArrayClone<T>(
  list: readonly ExitModel<T>[],
  render: (row: ExitModel<T>, i: number) => ExitArrayCloneOutList
) {
  renderKeyArray(list, function (row, i) {
    const ref = useRef<ExitArrayCloneOutList>()
    renderIf(row.step == 'exiting' || row.step == 'will-exiting', function () {
      const out = ref.current!
      if ('node' in out) {
        useApplyOne(out, row)
      } else {
        if (out.call) {
          useEffect(out.call, emptyArray)
        }
        out.list.forEach(item => {
          useApplyOne(item, row)
        })
      }
    }, function () {
      ref.current = render(row, i)
    })
  })
}

function useApplyOne(item: ExitArrayCloneOut<any>, row: ExitModel<any>) {
  const cloneNode = useMemo(() => item.node.cloneNode(true), emptyArray)
  hookAddResult(cloneNode)
  const applyAnimate = item.applyAnimate
  const step = row.step
  useEffect(() => {
    if (step == 'exiting') {
      applyAnimate(cloneNode, row)
    }
  }, step)
}