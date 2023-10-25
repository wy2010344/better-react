import { KType, KVar } from "./kanren";
import { includeBlockNotChar } from "./tokenize";



/**
 * @todo 对and与or语句的处理 似乎比较麻烦
 * @param v 
 * @returns 
 */
export function stringifyLog(v: KType): string {
  if (v instanceof KVar) {
    return `{${v.flag}}`
  } else if (Array.isArray(v)) {
    return `[${v.map(x => stringifyLog(x)).join(' ')}]`
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

function arrayIs(v: KType, ...centers: string[]) {
  if (Array.isArray(v)) {
    for (const center of centers) {
      if (v[1] == center) {
        return true
      }
    }
  }
  return false
}