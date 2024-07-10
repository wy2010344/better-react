import { useEffect } from "better-react-helper"
import { DomAttribute, DomElementType, React, dom } from "better-react-dom"
import { useVersion } from 'better-react-helper'
type InputTypeProps<T extends DomElementType> = DomAttribute<T> & {
  value: string
  onValueChange(v: string): void
}
export function renderInput(type: "textarea", args: InputTypeProps<'textarea'>): HTMLTextAreaElement
export function renderInput(type: "input", props: Omit<InputTypeProps<"input">, 'type'> & {
  /**
   * 不支持那几项
   */
  type?: Exclude<DomAttribute<'input'>['type'], 'checkbox' | 'button' | 'hidden' | 'radio' | 'reset' | 'submit' | 'image'>
}): HTMLInputElement
export function renderInput(type: any, {
  value,
  onValueChange,
  onInput,
  onCompositionEnd,
  ...props
}: any) {
  //只是为了强制这个模块更新
  const [version, updateVersion] = useVersion()
  const input = dom[type as "input"]({
    ...props,
    onInput(e: any) {
      const newValue = input.value
      updateVersion()
      onValueChange(newValue)
      onInput?.(e)
    },
  }).render()
  //用useMemo更快触发,但会面临回滚问题
  useEffect(() => {
    if (value != input.value) {
      //外部值和内部值不一样,说明外部阻塞了变化
      input.value = value
    }
  }, [value, version])
  return input as any
}

export function renderInputCheckbox({
  checked,
  onCheckedChange,
  onInput,
  ...props
}: Omit<DomAttribute<'input'>, 'type'> & {
  checked?: any
  onCheckedChange(v?: boolean): void
}) {
  //只是为了强制这个模块更新
  const [version, updateVersion] = useVersion()
  const input = dom.input({
    /**
     * 使用onInput实时事件,而不是使用onKeyUp与onCompositionEnd
     * @param e 
     */
    ...props,
    onInput(e: any) {
      const newValue = input.checked
      updateVersion()
      onCheckedChange(newValue)
      onInput?.(e)
    },
    type: "checkbox"
  }).render()
  //用useMemo更快触发,但会面临回滚问题
  useEffect(() => {
    if (!checked == input.checked) {
      //外部值和内部值不一样,说明外部阻塞了变化
      input.checked = checked
    }
  }, [checked, version])
  return input
}