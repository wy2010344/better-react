import { dom } from "better-react-dom"
import { useAttrEffect, useVersion } from "better-react-helper"
import { DomAttribute, DomAttributeSO, DomElementType, React } from "wy-dom-helper"

export type TriggerTime = "onInput" | "onBlur"

/**
 * 主要就中额外的触发检查更新value
 * 可以onInput,onBlur,或者某些effect事件中
 * 设置状态值,或者重置version恢复成状态值
 * @param value 
 * @param input 
 * @param key 
 * @param dep 
 */
function useUpdateValue<K extends string>(
  value: string,
  input: {
    [key in K]: string | null
  },
  key: K,
  dep: any
) {
  useAttrEffect(() => {
    if (value != input[key]) {
      input[key] = value
    }
  }, [value, dep])
}


function useTrigger<
  K extends string,
  N extends {
    [key in K]: string | null
  }
>(
  triggerTime: TriggerTime = "onInput",
  props: Record<string, any>,
  value: string = "",
  onValueChange: (v: string) => void,
  render: (props: Record<string, any>) => N,
  key: K
) {
  //只是为了强制这个模块更新
  /**
   * updateVersion起的作用只是强制撤销,即禁止输入
   * 因为输入成功,value会变,自动触发同步比较与合并value
   */
  const [version, updateVersion] = useVersion()
  if (triggerTime == "onInput") {
    const onInput = props.onInput
    props.onInput = (e: any) => {
      const newValue = input[key] || ''
      updateVersion()
      onValueChange(newValue)
      onInput?.(e)
    }
  } else {
    const onBlur = props.onBlur
    props.onBlur = (e: any) => {
      const newValue = input[key] || ''
      updateVersion()
      onValueChange(newValue)
      onBlur?.(e)
    }
  }
  const input = render(props)
  useUpdateValue(value, input, key, version)
  return input
}

type InputTypeProps<T extends DomElementType> = DomAttributeSO<T> & {
  triggerTime?: TriggerTime,
  value?: string
  onValueChange(v: string): void
}

export type TextareaProps = InputTypeProps<'textarea'>
export type InputProps = Omit<InputTypeProps<"input">, 'type'> & {
  /**
   * 不支持那几项
   */
  type?: Exclude<DomAttribute<'input'>['type'],
    'checkbox'
    | 'button'
    | 'hidden'
    | 'radio'
    | 'reset'
    | 'submit'
    | 'image'>
}
export function renderInput(type: "textarea", args: TextareaProps): HTMLTextAreaElement
export function renderInput(type: "input", props: InputProps): HTMLInputElement
/**
 * 唯一的存在意义,是阻止了光标闪烁?
 * 如果没有通过onValueChange改变外部状态,则内部状态会恢复回来,即实时的.
 * @param type 
 * @param param1 
 * @returns 
 */
export function renderInput(type: any, {
  value,
  onValueChange,
  triggerTime,
  ...props
}: any) {
  return useTrigger(triggerTime, props, value, onValueChange, props => {
    return dom[type as "input"](props).render()
  }, 'value') as any
}

export type ContentEditableProps<T extends DomElementType> = DomAttributeSO<T> & {
  triggerTime?: TriggerTime
  value?: string
  onValueChange(v: string): void
}
export function renderContentEditable<T extends DomElementType>(
  type: T,
  arg: ContentEditableProps<T>
) {
  const {
    value,
    onValueChange,
    triggerTime,
    ...props
  } = arg as any
  return useTrigger(triggerTime, props, value, onValueChange, props => {
    return (dom[type as 'div'] as any)(props).render()
  }, 'textContent')
}

export type InputBoolProps = Omit<DomAttribute<'input'>, 'type'> & {
  type: "checkbox" | "radio"
  value?: string
  checked?: any
}
export function renderInputBool({
  checked,
  onInput,
  ...props
}: InputBoolProps) {
  checked = !!checked
  //只是为了强制这个模块更新
  const [version, updateVersion] = useVersion()
  const input = dom.input({
    /**
     * 使用onInput实时事件,而不是使用onKeyUp与onCompositionEnd
     * @param e 
     */
    ...props,
    onInput(e: any) {
      updateVersion()
      onInput?.(e)
    },
  }).render()
  useAttrEffect(() => {
    if (checked != input.checked) {
      input.checked = checked
    }
  }, [checked, version])
  return input
}