import { useEffect } from "better-react"
import { useChange } from "better-react-helper"

export function useTransitionValue<T>(show: boolean, {
  beforeEnter,
  enter,
  beforeLeave = enter,
  leave
}: {
  beforeEnter: T
  enter: T
  beforeLeave?: T
  leave: T
}) {
  const [state, setState] = useChange<'show' | 'hide'>()
  useEffect(() => {
    requestAnimationFrame(function () {
      if (show) {
        setState('show')
      } else {
        setState('hide')
      }
    })
  }, [show])
  if (show) {
    if (state == 'show') {
      //进入中
      return enter
    } else {
      //待进入
      return beforeEnter
    }
  } else {
    if (state == 'hide') {
      //退出中
      return leave
    } else {
      //待退出
      return beforeLeave
    }
  }
}