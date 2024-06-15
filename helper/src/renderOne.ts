import { EmptyFun, FalseType, emptyFun, quote } from "wy-helper";
import { renderArray } from "./renderMap";
import { getOpposite } from "./useVersion";


export function renderOne(key: any, render: EmptyFun) {
  renderArray([key], quote, render)
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