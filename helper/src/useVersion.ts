import { useReducer } from "better-react";

function increase(old: number) {
  return old + 1
}
function initZero() {
  return 0
}
/**
 * 如果更细化定制,是否是初始化参数,步进?
 * @returns 
 */
export function useVersion() {
  const [version, setVersion] = useReducer(increase, initZero);
  return [version, function (after?: (v: number) => void) {
    setVersion(undefined, after)
  }] as const
}