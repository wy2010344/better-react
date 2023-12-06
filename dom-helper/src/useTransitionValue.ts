import { EmptyFun, emptyArray } from "better-react"
import { run, useChange, useEffect, useMemo, useVersion } from "better-react-helper"


/**
 * 有这样一个问题
 * 同时退出与进入的,进入的要下一帧才生效,而退出的立即就生效了
 * @param exiting 
 * @param config 
 * @returns 
 */
export function useLifeTrans<T>(exiting: any, config: {
  from: T,
  show: T
  exit: T
}) {
  const [state, setState] = useChange(config.from)
  useEffect(() => {
    requestAnimationState(function () {
      setState(config.show)
    })
  }, emptyArray)
  return exiting ? config.exit : state
}

/**
 * 这个解决了同时性问题,但是会多render一次.
 * 如果状态是flushSync,则会出现裂口
 * @param exiting 
 * @param config 
 * @returns 
 */
export function useBaseLifeTransSameTime<T>(exiting: any, config: {
  from: T,
  show: T
  willExit?: T | boolean
  exit: T
}, ext?: {
  didChange?: (exiting?: boolean) => void
  disabled?: boolean
}) {
  const [state, setState] = useChange<'show' | 'hide' | undefined>(ext?.disabled ? 'show' : undefined)
  const willExit = config.willExit
    ? typeof config.willExit == 'boolean'
      ? config.show
      : config.willExit
    : config.willExit
  useEffect(() => {
    if (ext?.disabled) {
      return
    }
    if (exiting && !willExit) {
      ext?.didChange?.(exiting)
      return
    }
    requestAnimationState(function () {
      setState(exiting ? 'hide' : 'show')
      ext?.didChange?.(exiting)
    })
  }, [!exiting])
  if (ext?.disabled) {
    return config.show
  }
  if (!state) {
    return config.from
  }
  if (state == 'show') {
    if (exiting) {
      return willExit || config.exit
    }
    return config.show
  }
  return config.exit
}


export function useTimeout(fun: (v: any) => void, time: number, deps: any[]) {
  useEffect(() => {
    setTimeout(fun, time)
  }, deps)
}

export function useTimeoutAutoCancel(fun: (v: any) => void, time: number, deps: any[]) {
  useEffect(() => {
    const inv = setTimeout(fun, time)
    return function () {
      clearTimeout(inv)
    }
  }, deps)
}

export function useTimeoutVersion(fun: (v: any) => void, time: number) {
  const [version, updateVersion] = useVersion()
  useEffect(() => {
    if (version) {
      setTimeout(fun, time)
    }
  }, [version])
  return updateVersion
}


export function useLifeTransSameTime<T>(
  exiting: any,
  config: {
    from: T,
    show: T
    willExit?: T | boolean
    exit: T
  },
  resolve: () => void,
  timeout: number,
  disabled?: boolean
) {
  const updateVersion = useTimeoutVersion(resolve, timeout)
  return useBaseLifeTransSameTime(exiting, config, {
    didChange: updateVersion,
    disabled
  })
}

export function requestAnimationState(fun: EmptyFun) {
  cacheList.push(fun)
  if (cacheList.length == 1) {
    requestAnimationFrame(function () {
      cacheList.forEach(run)
      cacheList.length = 0
    })
  }
}
const cacheList: EmptyFun[] = []