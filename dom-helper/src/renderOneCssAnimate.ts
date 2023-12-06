import { renderExitAnimate, renderOneExitAnimate } from "better-react-helper"
import { useBaseLifeTransSameTime, useLifeTransSameTime } from "./useTransitionValue"
import { emptyArray } from "better-react"






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
    args: T,
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


export type FAnimateTime<T> = {
  //没有from的时候,enter忽略
  from?: T
  show: T
  willExit?: T
  //没有exit的时候,exit忽略
  exit?: T
  timeout: number
  exitTimeout?: number
}
export function renderOneFAnimateTime<T>(
  show: FAnimateTime<T> | false | null | undefined,
  {
    defaultExit,
    customExit,
    ...args }: {
      onAnimateComplete?(): void,
      //默认的退出,也依外部最新.如果没有指定配置
      defaultExit?: {
        willExit?: T
        exit: T
        timeout?: number
      }
      //外部定义的退出,也依外部最新,如果没有指定配置
      customExit?: {
        willExit?: T
        exit: T
        timeout?: number
      }
    },
  render: (
    args: T,
    ext: {
      exiting?: boolean;
      promise: Promise<any>;
    }
  ) => void
) {
  return renderExitAnimate<FAnimateTime<T>>(show ? [show] : emptyArray as any, getOneKey, {
    enterIgnore: enterIgnoreNoFrom,
    exitIgnore: defaultExit || customExit ? ignoreFalse : enterIgnoreNoFrom,
    ...args
  }, function (v) {
    const ct = useLifeTransSameTime<T>(
      v.exiting,
      {
        ...defaultExit,
        ...v.value,
        ...customExit
      } as any,
      v.resolve,
      v.exiting ? customExit?.timeout || v.value.exitTimeout || v.value.timeout || defaultExit?.timeout! : v.value.timeout,
      !v.value.from)!
    render(ct, v)
  })
}

function enterIgnoreNoFrom(v: {
  from?: any
}) {
  return !v.from
}
function exitIgnoreNoExit(v: {
  exit?: any
}) {
  return !v.exit
}

function getOneKey() {
  return 1
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
export type FAnimateConfig<T> = {
  //没有from的时候,enter忽略
  from?: T
  show: T
  willExit?: T
  //没有exit的时候,exit忽略
  exit?: T
}



export function renderOneFAnimate<T>(
  show: FAnimateConfig<T> | false | null | undefined,
  {
    defaultExit,
    customExit,
    ...args
  }: {
    onAnimateComplete?(): void,
    //默认的退出,也依外部最新.如果没有指定配置
    defaultExit?: {
      willExit?: T
      exit: T
    }
    //外部定义的退出,也依外部最新,如果没有指定配置
    customExit?: {
      willExit?: T
      exit: T
    }
  },
  render: (
    args: T,
    ext: {
      exiting?: boolean;
      promise: Promise<any>;
    }
  ) => void
) {
  return renderExitAnimate<FAnimateConfig<T>>(show ? [show] : emptyArray as any, getOneKey, {
    enterIgnore: enterIgnoreNoFrom,
    exitIgnore: defaultExit || customExit ? ignoreFalse : exitIgnoreNoExit,
    ...args
  }, function (v) {
    const ct = useBaseLifeTransSameTime<T>(
      v.exiting,
      {
        ...defaultExit,
        ...v.value,
        ...customExit
      } as any, {
      disabled: !v.value.from
    })!
    render(ct, v)
  })
}

function ignoreFalse() {
  return false
}