import { emptyArray } from "better-react"
import { useChange, useEffect, useMemo, useVersion } from "better-react-helper"


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
    requestAnimationFrame(function () {
      setState(config.show)
    })
  }, emptyArray)
  return exiting ? config.exit : state
}

/**
 * 这个解决了同时性问题,但是会多render一次.
 * @param exiting 
 * @param config 
 * @returns 
 */
export function useBaseLifeTransSameTime<T>(exiting: any, config: {
  from: T,
  show: T
  willExit?: T
  exit: T
}, {
  didChange,
  disabled
}: {
  didChange?: (exiting?: boolean) => void
  disabled?: boolean
}) {
  const [state, setState] = useChange<'show' | 'hide'>()
  useEffect(() => {
    if (disabled) {
      return
    }
    requestAnimationFrame(function () {
      setState(exiting ? 'hide' : 'show')
      didChange?.(exiting)
    })
  }, [!exiting])
  if (disabled) {
    return config.show
  }
  if (!state) {
    return config.from
  }
  if (state == 'show') {
    if (exiting) {
      return config.willExit || config.show
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
    willExit?: T
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