import { useEffect } from "better-react";
import { useRef } from "./useRef";


/**
 * 版本锁,同步的
 * @param init 
 * @returns 
 */
export function useVersionLock(init = 0) {
  const ref = useRef(0)
  return [ref.get, () => {
    const v = ref.get() + 1
    ref.set(v)
    return v
  }] as const
}


/**
 * 如果不是第一次,会是false
 * @returns 
 */
export function useIsLaunchLock() {
  const ref = useRef(true)
  useEffect(() => {
    ref.set(false)
  }, [])
  return ref.get()
}