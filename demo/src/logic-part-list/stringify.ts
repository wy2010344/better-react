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
  } else if (Array.isArray(v)) {
    if (v.length == 3) {
      if (v[1] == ',') {
        let first = stringifyLog(v[0])
        let second = stringifyLog(v[2])
        if (arrayIs(v[0], ';', '|')) {
          first = `(${first})`
        }
        if (arrayIs(v[2], ';', '|', ',')) {
          second = `(${second})`
        }
        return `${first}${v[1]}${second}`
      } else if (v[1] == ';' || v[1] == '|') {
        let first = stringifyLog(v[0])
        let second = stringifyLog(v[2])
        if (arrayIs(v[2], ';', '|')) {
          second = `(${second})`
        }
        return `${first}${v[1]}${second}`
      }
    }
    return `${v.map(x => stringifyLog(x)).join(' ')}`
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
