import { useEffect } from "better-react"
import { DomElements, useDom } from "better-react-dom"
import { useRef } from 'better-react-helper'
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
  const selectRef = useRef<{
    start: number | null
    end: number | null
  } | null>(null)
  const input = useDom(type, {
    onInput(e: any) {
      const newValue = input.value
      input.type == ""
      selectRef.set({
        start: input.selectionStart,
        end: input.selectionEnd
      })
      input.value = value
      onValueChange(newValue)
      onInput?.(e)
    },
    ...props
  }) as HTMLInputElement
  useEffect(() => {
    input.value = value
    const select = selectRef.get()
    if (select) {
      selectRef.set(null)
      if (select.start != input.selectionStart) {
        input.selectionStart = select.start
      }
      if (select.end != input.selectionEnd) {
        input.selectionEnd = select.end
      }
    }
  }, [value])
  return input
}