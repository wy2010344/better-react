import { useReducer } from "./useReducer";


function increase(old: number) {
  return old + 1
}
/**
 * 如果更细化定制,是否是初始化参数,步进?
 * @returns 
 */
export function useVersion(init = 0) {
  const [version, dispatch] = useReducer(increase, init);
  return [version, dispatch as (v?: any, after?: (v: number) => void) => void] as const
}