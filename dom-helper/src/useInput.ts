import { useMemo } from "better-react"
import { DomElements, useDom } from "better-react-dom"
import { useRef, useVersion } from 'better-react-helper'
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
  //只是为了强制这个模块更新
  const [version, updateVersion] = useVersion()
  const input = useDom(type, {
    onInput(e: any) {
      e.preventDefault()
      const newValue = input.value
      updateVersion()
      onValueChange(newValue)
      onInput?.(e)
    },
    ...props
  }) as HTMLInputElement
  //用useMemo更快触发
  useMemo(() => {
    if (value != input.value) {
      //外部值和内部值不一样,说明外部阻塞了变化
      input.value = value
    }
  }, [value, version])
  return input
}