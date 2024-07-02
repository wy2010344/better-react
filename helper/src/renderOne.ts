import { EmptyFun, FalseType, GetValue, emptyFun, quote } from "wy-helper";
import { renderArray, renderArrayToArray } from "./renderMap";
import { getOpposite } from "./useVersion";


export function renderOne(key: any, render: EmptyFun) {
  renderArray([key], quote, render)
}
export function renderOneGet<V>(key: any, render: GetValue<V>) {
  return renderArrayToArray([key], quote, render)[0]
}



export function renderIf<T>(
  value: T,
  renderTrue: (v: Exclude<T, FalseType>) => void,
  renderFalse: (v: Extract<T, FalseType>) => void = emptyFun
) {
  renderArray([value], getOpposite, function (v) {
    if (v) {
      renderTrue(v as any)
    } else {
      renderFalse(v as any)
    }
  })
}

export function renderIfGet<T, V>(
  value: T,
  renderTrue: (v: Exclude<T, FalseType>) => V,
  renderFalse: (v: Extract<T, FalseType>) => V
) {
  return renderArrayToArray([value], getOpposite, function (v) {
    if (v) {
      renderTrue(v as any)
    } else {
      renderFalse(v as any)
    }
  })[0]
}

export function renderGuard<T, V>(
  data: T,
  callback: (d: T, v: V) => EmptyFun | void,
  list: V[],
  notFun = emptyFun
) {
  let outKey = -1
  let renderFun = notFun
  for (let i = 0; i < list.length; i++) {
    const out = list[i]
    const fun = callback(data, out)
    if (fun) {
      outKey = i
      renderFun = fun
      break
    }
  }
  renderOne(outKey, renderFun)
}


export function renderGuardString<T extends string>(type: T, record: Partial<Record<T, EmptyFun>>, other = emptyFun) {
  const v = record[type]
  renderOne(type, (v || other)!)
}