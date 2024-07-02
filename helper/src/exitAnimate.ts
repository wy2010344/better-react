import { useAtomFun } from "./useRef"
import { renderArray } from "./renderMap"
import { emptyArray, emptyObject, ExitAnimateArg, buildUseExitAnimate, quote, ExitModel, alawaysTrue, createEmptyExitListCache, FalseType } from "wy-helper"
import { useEffect } from "./useEffect"
import { hookMakeDirtyAndRequestUpdate } from "better-react"





export function useExitAnimate<V>(
  outList: readonly V[],
  getKey: (v: V) => any,
  arg: ExitAnimateArg<V> = emptyObject
) {
  //用于删除后强制刷新
  const makeDirtyAndRequestUpdate = hookMakeDirtyAndRequestUpdate()
  //每次render进来,合并cacheList,因为有回滚与副作用,所以必须保持所有变量的无副作用
  const cacheList = useAtomFun(createEmptyExitListCache).get()
  const { list, effect } = buildUseExitAnimate(makeDirtyAndRequestUpdate, cacheList, quote, outList, getKey, arg)
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
export function useOneExitAnimate<T>(
  value: T,
  {
    ignore,
    getKey = quote,
    ...args
  }: {
    ignore?: boolean
    getKey?: (v: T) => any,
    onAnimateComplete?(): void
  } = emptyObject
) {
  return useExitAnimate(
    [value],
    getKey,
    {
      enterIgnore: ignore ? alawaysTrue : undefined,
      exitIgnore: ignore ? alawaysTrue : undefined,
      ...args
    }
  )
}



export function renderIfExitAnimate<T>(
  show: T,
  renderTrue: (v: ExitModel<Exclude<T, FalseType>>) => void,
  other?: ExitAnimateArg<T> & {
    renderFalse?(v: ExitModel<Extract<T, FalseType>>): void
  }) {
  const list = useExitAnimate(
    show ? [show] : other?.renderFalse ? [show] : emptyArray,
    renderIfGetKey,
    other)
  renderArray(list, getKen, function (v) {
    if (v.value) {
      renderTrue(v as any)
    } else if (other?.renderFalse) {
      other.renderFalse(v as any)
    }
  })
}


function renderIfGetKey<T>(v: T) {
  return !v
}