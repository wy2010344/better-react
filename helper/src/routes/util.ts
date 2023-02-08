export type Scope = { [key: string]: string }
export type MathResult = {
  rest: string[]
  scope: Scope
}
export type MatchFun = (v: string[]) => MathResult | false
export type MathRule = {
  match: MatchFun
  render(v: MathResult): void
}

/**
 * 转化成绝对路径
 * @param nodes 
 * @returns 
 */
export function toAbsolutePath(nodes: string[]) {
  return '/' + nodes.join('/')
}


type MatchNode = (node: string, scope: Scope) => Scope | void
function equalMatch(path: string): MatchNode {
  return function (node, scope) {
    if (node == path) {
      return scope
    }
    return
  }
}
function defineMatch(key: string): MatchNode {
  return function (node, scope) {
    scope[key] = node
    return scope
  }
}
/**
 * 生成简单的匹配规则 /aefw/:da/faew/ewf
 * @param path 
 * @returns 
 */
export function compileSimpleRule(path: string) {
  const nodes = path.split('/')
  const newNodes: MatchNode[] = []
  const keys = new Set<string>()
  for (const node of nodes) {
    if (node) {
      if (node.startsWith(":")) {
        const key = node.slice(1)
        if (keys.has(key)) {
          throw new Error("存在重复的key")
        } else {
          keys.add(key)
          newNodes.push(defineMatch(key))
        }
      } else {
        newNodes.push(equalMatch(node))
      }
    }
  }
  return newNodes
}

function baseMatch(nodes: string[], matches: MatchNode[]) {
  let scope: Scope = {}
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i]
    const node = nodes[i]
    const newScope = match(node, scope)
    if (newScope) {
      scope = newScope
    } else {
      return
    }
  }
  return scope
}

/**
 * 路径以规则开始,可能存在剩余
 * @param matches 
 * @returns 
 */
export function pathStartWith(matches: MatchNode[]): MatchFun {
  return function (nodes) {
    if (nodes.length >= matches.length) {
      const scope = baseMatch(nodes, matches)
      if (scope) {
        return {
          scope,
          rest: nodes.slice(matches.length)
        }
      }
    }
    return false
  }
}

/**
 * 路径与规则完全匹配上
 * @param matches 
 * @returns 
 */
export function pathExactly(matches: MatchNode[]): MatchFun {
  return function (nodes) {
    if (nodes.length == matches.length) {
      const scope = baseMatch(nodes, matches)
      if (scope) {
        return {
          scope,
          rest: []
        }
      }
    }
    return false
  }
}
export type MatchRoute<T extends Scope = {}> = {
  match: MatchFun
  render(scope: T): void
}
export function createMatch<T extends Scope = {}>(
  match: MatchFun,
  render: (scope: T) => void
) {
  return {
    match,
    render
  }
}

/**
 * 根据节点查找匹配的路径与方法
 * @param path 
 * @param matchRules 
 * @param other 
 * @returns 
 */
export function getMatchRoutes(
  path: string[],
  matchRules: MathRule[],
  other?: (v: string[]) => void
) {
  let rest: MathResult
  let restIndex = -1
  for (let i = 0; i < matchRules.length && restIndex < 0; i++) {
    const rule = matchRules[i]
    const result = rule.match(path)
    if (result) {
      rest = result
      restIndex = i
    }
  }
  return {
    index: restIndex,
    render() {
      if (restIndex < 0) {
        other?.(path)
      } else {
        matchRules[restIndex].render(rest)
      }
    }
  }
}