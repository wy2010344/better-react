import { useEffect } from "better-react"
import { DomElements, useDom } from "better-react-dom"
type InputType = "input" | "textarea"
type InputTypeProps = DomElements[InputType] & {
  value: string
  onValueChange(v: string): void
}
export default (type: InputType, {
  value,
  onValueChange,
  onInput,
  ...props
}: InputTypeProps) => {
  const input = useDom(type, {
    onInput(e: any) {
      const newValue = input.value
      input.value = value
      onValueChange(newValue)
      onInput?.(e)
    },
    ...props
  }) as HTMLInputElement
  useEffect(() => {
    input.value = value
  }, [value])
}