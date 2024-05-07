import { flushSync, startTransition } from "better-react"
import { dom } from "better-react-dom"
import { useChange } from "better-react-helper"
import { EmptyFun } from "wy-helper"

const timeTypes = ['realTime', 'normal', 'transition'] as const
export type TimeType = typeof timeTypes[number]
export default function renderTimeType() {
  const [timeType, setTimeType] = useChange<TimeType>('normal')
  const select = dom.select({
    onInput(e) {
      setTimeType(select.value as TimeType)
    },
  }).renderFragment(function () {
    timeTypes.map(row => {
      dom.option({
        value: row,
        selected: row == timeType
      }).renderText`${row}`
    })
  })
  return timeType
}


export function setTimeType(timeType: TimeType, fun: EmptyFun) {
  if (timeType == 'normal') {
    fun()
  } else if (timeType == 'realTime') {
    flushSync(fun)
  } else if (timeType == 'transition') {
    startTransition(fun)
  }
}