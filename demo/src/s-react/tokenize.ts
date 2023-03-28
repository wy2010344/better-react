type Item = {
  type: "atom"
  index: number
  value: string
}
export const whiteList = ' \r\n\t'.split('')
const infixAtom = './|:'.split('')
const prefixAtom = '!~'.split('')
//关键字,自成一个   
/**
 * . 访问属性
 * / 将前面的结果传递给函数
 * | 结合生成一个Atom
 * : 变量绑定
 * 
 * 可能还需要默认...解包语法(同类型赋值)用~
 * \!非语法
 */
const keywords = '()'.split('').concat(infixAtom).concat(prefixAtom)


function parseString(content: string, split: string, i: number) {
  let next = i + 1
  while (next < content.length) {
    const char = content[next]
    if (char == '\\') {
      //跳过下一个
      next = next + 2
    } else if (char == split) {
      //结束字符串
      return next + 1
    } else {
      //普通
      next++
    }
  }
  console.error("未结束的字符串")
  return content.length
}

const otherKEYS = whiteList.concat(keywords).concat(['"', '`'])
function parseToken(content: string, i: number) {
  let next = i + 1
  while (next < content.length) {
    const char = content[next]!
    if (otherKEYS.includes(char)) {
      return next
    }
    next++
  }
  return content.length
}

export function tokenize(content: string) {
  console.log(content)
  let i = 0
  const len = content.length
  const tokens: Item[] = []
  while (i < len) {
    const char = content[i]!
    if (whiteList.includes(char)) {
      //跳过空白
      i++
    } else if (keywords.includes(char)) {
      tokens.push({
        type: "atom",
        index: i,
        value: char
      })
      i++
    } else if ('"' == char) {
      //开始字符串
      const endIndex = parseString(content, '"', i)
      tokens.push({
        type: "atom",
        index: i,
        value: content.substring(i, endIndex)
      })
      i = endIndex
    } else if ('`' == char) {
      //开始注释
      i = parseString(content, '`', i)
    } else {
      //开始普通token
      const endIndex = parseToken(content, i)
      tokens.push({
        type: "atom",
        index: i,
        value: content.substring(i, endIndex)
      })
      i = endIndex
    }
  }
  return tokens
}


type Tree = {
  type: "tree"
  before: Item
  end: Item
  children: (Item | Tree)[]
}
export function parseTree(list: Item[]) {
  const topList: Tree = {
    type: "tree",
    before: null as any,
    end: null as any,
    children: []
  }
  const stackList: Tree[] = [
    topList
  ]
  let i = 0
  while (i < list.length) {
    const row = list[i]
    if (row.value == "(") {
      const newTree: Tree = {
        type: "tree",
        before: row,
        end: null as any,
        children: []
      }
      stackList.at(-1)!.children.push(newTree)
      stackList.push(newTree)
    } else if (row.value == ")") {
      if (stackList.length == 1) {
        console.error("过多的括号,无法解析完成", list.slice(i))
        return topList.children
      }
      stackList.at(-1)!.end = row
      stackList.pop()
    } else {
      stackList.at(-1)!.children.push(row)
    }
    i++
  }
  if (stackList.length != 1) {
    console.error(`缺少${stackList.length - 1}个括号`)
  }
  return topList.children
}

type MAllItem = Item | MTree | InfixItem | PrefixItem
type InfixItem = {
  type: "." | "/" | "|" | ':'
  before: MAllItem
  after: MAllItem
}
type PrefixItem = {
  type: "!" | "~"
  after: MAllItem
}
type MTree = {
  type: "tree",
  before: Item
  end: Item
  children: MAllItem[]
}

function mergeItem(item: Tree | Item) {
  if (item.type == "atom") {
    return item
  } else {
    return {
      ...item,
      children: mergeTree(item.children)
    }
  }
}
/**
 * 合并中缀
 * @param list 
 */
export function mergeTree(list: (Tree | Item)[]) {
  const newList: MAllItem[] = []
  let i = 0
  while (i < list.length) {
    const row = list[i]
    if (row.type == "atom" && infixAtom.includes(row.value)) {
      if (prefixAtom.includes(row.value)) {
        const after = list[i + 1]
        if (!after) {
          console.error("需要一个后缀")
          i++
        } else {
          newList.push({
            type: row.value as "!",
            after: mergeItem(after)
          })
          i = i + 2
        }
      } else if (infixAtom.includes(row.value)) {
        const before = newList.at(-1)
        const after = list[i + 1]
        if (!before) {
          console.error("不存在中缀的前面一个")
          i++
        } else if (!after) {
          console.error("不存在中缀的后一个")
          i++
        } else {
          newList.pop()
          newList.push({
            type: row.value as '.',
            before,
            after: mergeItem(after)
          })
          i = i + 2
        }
      }
    } else {
      newList.push(mergeItem(row))
      i++
    }
  }
  return newList
}
