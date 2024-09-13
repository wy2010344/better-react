import { useMemo } from "./useRef"

/**
 * 变化方向,只在触发时
 * @param value 索引
 * @returns 0不变,1向左,-1向右,索引必须大于1
 */
export function useDirection(value: number) {
  if (value < 0) {
    value = 0
  }

  const row = useMemo<number, number>(e => {
    if (e.isInit) {
      return 0
    } else {
      return value - e.beforeValue
    }
  }, value)
  return [
    Math.sign(row),
    value,
    row
  ] as const
}