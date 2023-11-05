import { KPair, KSymbol, KType, KVar } from "./kanren";
import { includeBlockNotChar } from "./tokenize";



export function tryParsePair(v: KPair<KType, KType>) {
  //区分能表达的,term,list,$number.$number怎么处理?开始是数字,长度一定,每一个都是nat
  const first = v.left
  //作为list处理
  const leftList: KType[] = []
  let last = v.right
  while (last instanceof KPair) {
    leftList.push(last.left)
    last = last.right
  }

  if (first instanceof KPair && last == null) {
    const f1 = first.left
    const f2 = first.right
    if (f1 == leftList.length) {
      //长度与符号
      if (f2 == KSymbol.nat && leftList.every(x => x == 1)) {
        //是为一般数字
        return {
          type: "number",
          value: first
        } as const
      }
      //是为term
      if (f2 == KSymbol.term) {
        return {
          type: "term",
          list: leftList
        } as const
      }
    }
  }
  //作为普通list
  leftList.unshift(first)

  return {
    type: "pair",
    leftList,
    last
  } as const
}
/**
 * @todo 对and与or语句的处理 似乎比较麻烦
 * @param v 
 * @returns 
 */
export function stringifyLog(v: KType): string {
  if (v instanceof KVar) {
    return `{${v.flag}}`
  } else if (v instanceof KPair) {
    const out = tryParsePair(v)
    if (out.type == 'number') {
      return `$${out.value}`
    }
    if (out.type == 'term') {
      return `(${out.list.map(v => stringifyLog(v)).join(' ')})`
    }
    const last = out.last
    return `[${out.leftList.map(v => stringifyLog(v)).join(' ')}${last ? `| ${stringifyLog(last)}]` : ']'}`
  } else if (typeof (v) == 'string') {
    const trans = v.replace(/\\/g, '\\\\').replace(/'/g, "\\\'")
    const notBlock = includeBlockNotChar(trans)
    if (trans.length != v.length && notBlock) {
      //包含转义符号
      return `'${trans}'`
    }
    return v
  } else if (v == null) {
    return '$nil'
  } else {
    return v + ''
  }
}