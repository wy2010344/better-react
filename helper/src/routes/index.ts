import { createContext } from "better-react";
import { getMatchRoutes, MatchRoute, MathRule } from "./util";
import { renderOne } from "../renderOne";

export function renderRoutes(
  path: string[],
  matchRules: MathRule[],
  other?: (v: string[]) => void
) {
  const match = getMatchRoutes(path, matchRules, other)
  renderOne(match.index, match.render)
}
function getKey(v: ReturnType<typeof getMatchRoutes>) {
  return v.index
}
export const RouteContext = createContext<{
  paths: string[]
  getPrefix(): string[]
}>({
  paths: [],
  getPrefix() {
    return []
  }
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
  const { paths, getPrefix } = RouteContext.useConsumer()
  renderRoutes(paths, matches.map(match => {
    return {
      match: match.match,
      render({ scope, rest }) {
        RouteContext.hookProvider({
          paths: rest,
          getPrefix() {
            return [...getPrefix(), ...slicePrefix(paths, rest)]
          }
        })
        match.render(scope)
      }
    }
  }), function (rest) {
    RouteContext.hookProvider({
      paths: rest,
      getPrefix() {
        return [...getPrefix(), ...slicePrefix(paths, rest)]
      }
    })
    other()
  })
}

function slicePrefix(paths: string[], rest: string[]) {
  return paths.slice(0, paths.length - rest.length)
}