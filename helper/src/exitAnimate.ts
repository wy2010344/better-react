import { useAtomFun } from "./useRef"
import { useVersion } from "./useVersion"
import { renderArray } from "./renderMap"
import { emptyArray, createEmptyArray, emptyObject, ExitAnimateArg, buildUseExitAnimate, quote, ExitModel, alawaysTrue } from "wy-helper"
import { useEffect } from "./useEffect"





export function useRenderExitAnimate<V>(
  outList: readonly V[],
  getKey: (v: V) => any,
  arg: ExitAnimateArg<V> = emptyObject
) {
  //用于删除后强制刷新
  const [_, updateVersion] = useVersion()
  //每次render进来,合并cacheList,因为有回滚与副作用,所以必须保持所有变量的无副作用
  const cacheList = useAtomFun<any>(createEmptyArray)
  const { list, effect } = buildUseExitAnimate(updateVersion, cacheList, quote, outList, getKey, arg)
  useEffect(effect)
  return list
}

export function renderExitAnimateArray<V>(
  vs: readonly ExitModel<V>[],
  render: (v: ExitModel<V>) => void) {
  renderArray(vs, getKen, function (value) {
    render(value)
  })
}

function getKen<V>(v: ExitModel<V>) {
  return v.key
}
/**
 * 只有一个元素的
 */
export function useRenderOneExitAnimate<T>(
  show: T | undefined | null | false | void,
  {
    ignore,
    ...args
  }: {
    ignore?: boolean
    onAnimateComplete?(): void
  } = emptyObject
) {
  return useRenderExitAnimate(
    show ? [show] : emptyArray,
    alawaysTrue,
    {
      enterIgnore: show && ignore ? alawaysTrue : undefined,
      exitIgnore: !show && ignore ? alawaysTrue : undefined,
      ...args
    }
  )
}