import { renderOneExitAnimate } from "better-react-helper"
import { useBaseLifeTransSameTime, useLifeTransSameTime } from "./useTransitionValue"






export type ClassAndStyle = {
  className?: string
  style?: string
}
/**
 * 这里不处理替换
 * 替换是各自处理自己的参数
 * 但替换就涉及像scene怎样转场.
 * 像依赖上一步的push或pop
 * 或者平行替换,replace,各自处理自己的
 * 平等替换很简单,各自作自己的配置
 */
type TAnimateValueTime<T> = {
  //创建与销毁的配置.在销毁时仍然生效
  from?: T
  show?: T
  willExit?: T
  exit?: T
  timeout: number
}

export function renderOneTAnimateTime<T>(
  show: any,
  {
    value,
    ...args
  }: {
    value: TAnimateValueTime<T>,
    onAnimateComplete?(): void,
    ignore?: any
  },
  render: (
    args: T | undefined,
    ext: {
      exiting?: boolean;
      promise: Promise<any>;
    }
  ) => void
) {
  renderOneExitAnimate(show, args, function (v) {
    const ct = useLifeTransSameTime<T>(
      v.exiting,
      value as any,
      v.resolve,
      value.timeout, args.ignore)!
    render(ct, v)
  })
}


type TAnimateValue<T> = {
  //只创建(新增)
  from: T
  show: T,
  willExit?: never
  exit?: never
} | {
  //只销毁,告知销毁,并配送销毁参数
  from?: never
  show?: never
  willExit?: T
  exit: T
}

export function renderOneTAnimate<T>(
  show: any,
  {
    value,
    ...args
  }: {
    value: TAnimateValue<T>,
    ignore?: any
    onAnimateComplete?(): void
  },
  render: (
    args: T | undefined,
    ext: {
      exiting?: boolean;
      promise: Promise<any>;
      resolve(v?: any): void
    }
  ) => void
) {
  renderOneExitAnimate(show, args, function (v) {
    const ct = useBaseLifeTransSameTime<T>(
      v.exiting,
      value as any, {
      disabled: args.ignore
    })!
    render(ct, v)
  })
}