import { useEffect, useMemo } from "better-react"
import { DomElements, useDom } from "better-react-dom"
import { useRef, useState } from 'better-react-helper'
type InputType = "input" | "textarea"
type InputTypeProps = DomElements[InputType] & {
  value: string
  onValueChange(v: string): void
}
export function useInput(type: InputType, {
  value,
  onValueChange,
  onInput,
  ...props
}: InputTypeProps) {
  const [innerValue, setInnerValue] = useState(value)
  const input = useDom(type, {
    onInput(e: any) {
      const newValue = input.value
      // selectRef.set({
      //   value: newValue,
      //   start: input.selectionStart,
      //   end: input.selectionEnd
      // })
      setInnerValue(newValue)
      onValueChange(newValue)
      onInput?.(e)
    },
    ...props
  }) as HTMLInputElement
  //用useMemo更快触发
  useMemo(() => {
    if (value != innerValue) {
      //外部值和内部值不一样,说明外部阻塞了变化
      input.value = innerValue
      setInnerValue(value)
    }
    // const select = selectRef.get()
    // if (select) {
    //   selectRef.set(null)
    //   if (select.start != input.selectionStart) {
    //     input.selectionStart = select.start
    //   }
    //   if (select.end != input.selectionEnd) {
    //     input.selectionEnd = select.end
    //   }
    // }
  }, [value, innerValue])
  return input
}