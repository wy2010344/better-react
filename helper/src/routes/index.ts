import { createContext, useOne } from "better-react";
import { useRefState } from "../useRefState";
import { getMatchRoutes, MatchRoute, MathRule } from "./util";

export function useRoutes(
  path: string[],
  matchRules: MathRule[],
  other?: (v: string[]) => void
) {
  const match = getMatchRoutes(path, matchRules, other)
  useOne(match, getKey, match.render)
}
function getKey(v: ReturnType<typeof getMatchRoutes>) {
  return v.index
}
export const RouteContext = createContext<{
  paths: string[]
  changePaths: ChangePaths
}>({
  paths: [],
  changePaths() {
    throw new Error("unallowed")
  },
})

export function routeMatch(...matches: MatchRoute[]) {
  return routeMathWithOther({
    matches,
    other() {

    },
  })
}
export function routeMathWithOther({
  matches,
  other
}: {
  matches: MatchRoute[],
  other(): void
}) {
  const { paths, changePaths } = RouteContext.useConsumer()
  useRoutes(paths, matches.map(match => {
    return {
      match: match.match,
      render({ scope, rest }) {
        RouteContext.useProvider({
          paths: rest,
          changePaths() {
            const [n, opt] = arguments
            if (Array.isArray(n)) {
              const vs = opt?.absolute ? n : [...getPrefix(paths, rest), ...n]
              changePaths(vs, opt)
            } else {
              changePaths(n)
            }
          },
        })
        match.render(scope)
      }
    }
  }), function (rest) {
    RouteContext.useProvider({
      paths: rest,
      changePaths() {
        const [n, opt] = arguments
        if (Array.isArray(n)) {
          const vs = opt?.absolute ? n : [...getPrefix(paths, rest), ...n]
          changePaths(vs, opt)
        } else {
          changePaths(n)
        }
      },
    })
    other()
  })
}

type ChangePaths = {
  (n: number): void
  (n: string[], opt?: {
    //相对路径
    absolute?: boolean
    //替换
    replace?: boolean
  }): void
}

function getPrefix(paths: string[], rest: string[]) {
  return paths.slice(0, paths.length - rest.length)
}

export function useHistory(
  initname: string[][] | (() => string[][]),
  trigger: (path: string[], replace?: boolean) => void,
  go: (n: number) => void,
  initIndex = 0
) {
  const [historyList, setHistoryList, getHistoryList] = useRefState<string[][]>(initname)
  const [historyIndex, setHistoryIndex, getHistoryIndex] = useRefState(initIndex)
  function setPathName(pathName: string[], replace?: boolean) {
    const oldList = getHistoryList()
    console.log("vs")
    if (replace) {
      const replaceList = oldList.slice()
      replaceList.pop()
      replaceList.push(pathName)
      setHistoryList(replaceList)
      trigger(pathName, true)
    } else {
      setHistoryIndex(oldList.length)
      setHistoryList([...oldList, pathName])
      trigger(pathName)
    }
  }
  const paths = historyList[historyIndex]
  const changePaths: ChangePaths = function () {
    const [n, opt] = arguments
    if (Array.isArray(n)) {
      setPathName(n, opt?.replace)
    } else {
      const historyIndex = getHistoryIndex()
      let newHistoryIndex = historyIndex + n
      if (newHistoryIndex < 0) {
        newHistoryIndex = 0
      }
      const maxLen = getHistoryList().length - 1
      if (newHistoryIndex > maxLen) {
        newHistoryIndex = maxLen
      }
      if (newHistoryIndex != historyIndex) {
        setHistoryIndex(newHistoryIndex)
      }
      go(n)
    }
  }
  return {
    paths,
    changePaths
  }
}