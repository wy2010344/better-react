import { KType, KVar, Pair } from "./kanren";
import { includeBlockNotChar } from "./tokenize";



/**
 * @todo 对and与or语句的处理 似乎比较麻烦
 * @param v 
 * @returns 
 */
export function stringifyLog(v: KType): string {
  if (v instanceof KVar) {
    return `{${v.flag}}`
  } else if (v instanceof Pair) {
    return pairToList(v)
  } else if (typeof (v) == 'string') {
    const trans = v.replace(/\\/g, '\\\\').replace(/'/g, "\\\'")
    const notBlock = includeBlockNotChar(trans)
    if (trans.length != v.length && notBlock) {
      //包含转义符号
      return `'${trans}'`
    }
    return v
  } else {
    return '[]'
  }
}

function pairToList(v: Pair<KType, KType>): string {
  const list: string[] = []
  let last: KType = null
  while (v) {
    list.push(stringifyLog(v.left))
    const temp = v.right
    if (temp instanceof Pair) {
      v = temp
    } else {
      last = temp
      break
    }
  }
  if (last == null) {
    return `[${list.join(' ')}]`
  }
  list.push(stringifyLog(last))
  return `(${list.join(' ')})`
}
