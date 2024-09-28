import { createContext, renderStateHolder } from 'better-react'
import { renderOne, useCallbackPromiseState, useMemo } from 'better-react-helper'
import { emptyArray, emptyFun, EmptyFun, run } from 'wy-helper'
import { ThisRelativeHistory, MatchRule, RelativeHistory } from 'wy-helper/router'

type Page<T extends Record<string, string> = any> = (v: T) => void
export type Route = ({
  match: MatchRule
  getPage(): Promise<{
    default: Page
  }>
  page?: never
  routes?: never
} | {
  match: MatchRule
  getPage?: never
  page: Page
  routes?: never
} | {
  match: MatchRule
  getPage?: never
  page?: never
  routes: Route[]
  renderLayout?(render: EmptyFun): void
  renderNotFoun?(): void
}) & {
  renderError?: RenderError,
  renderLoading?: EmptyFun
}


export type RenderError = (v: any) => void

export function createRouter({
  routes,
  renderNotFoun = emptyFun,
  renderError = emptyFun,
  renderLoading = emptyFun
}: {
  routes: Route[],
  renderError?: RenderError,
  renderLoading?: EmptyFun
  renderNotFoun?(): void
}) {
  function getPage(pathNodes: readonly string[]) {
    let outKey = -1
    let renderFun = renderNotFoun
    for (let i = 0; i < routes.length; i++) {
      const route = routes[i]
      const out = route.match(pathNodes)
      if (out) {
        const outMap = out.query
        const restNodes = out.restNodes
        const matchNodes = out.matchNodes
        outKey = i
        if (route.getPage) {
          renderFun = () => {
            renderWithIgnoreMore(matchNodes, restNodes, out.ignoreMore, () => {
              renderImportDefault(
                route.getPage,
                route.renderError || renderError,
                route.renderLoading || renderLoading,
                outMap)
            })
          }
        } else if (route.page) {
          renderFun = () => {
            renderWithIgnoreMore(matchNodes, restNodes, out.ignoreMore, () => {
              route.page!(outMap)
            })
          }
        } else {
          const renderRoute = createRouter({
            routes: route.routes,
            renderError: route.renderError || renderError,
            renderLoading: route.renderLoading || renderLoading,
            renderNotFoun: route.renderNotFoun || renderNotFoun
          })
          const renderLayout = route.renderLayout || run
          renderFun = () => {
            renderWithMatch(matchNodes, restNodes, () => {
              renderLayout(() => {
                renderRoute(restNodes)
              })
            })
          }
        }
        break
      }
    }
    return [renderFun, outKey] as const
  }

  return function (
    pathNodes: readonly string[]
  ) {
    const [renderPage, key] = useMemo(() => {
      return getPage(pathNodes)
    }, pathNodes)
    renderOne(key, renderPage)
  }
}
function renderWithIgnoreMore(
  matchNodes: string[],
  restNodes: string[],
  ignoreMore: boolean,
  render: EmptyFun
) {
  if (ignoreMore) {
    renderWithMatch(matchNodes, restNodes, render)
  } else {
    render()
  }
}

export const RouterContext = createContext<{
  pathNodes: readonly string[]
  rHistory: RelativeHistory
}>(undefined as any)

function renderWithMatch(
  matchNodes: string[],
  restNodes: string[],
  render: EmptyFun
) {
  const ctx = RouterContext.useConsumer()
  const rHistory = useMemo(() => {
    return new ThisRelativeHistory(ctx.rHistory, matchNodes)
  }, [ctx.rHistory, matchNodes])
  renderStateHolder(() => {
    //不用也可以,用了更安全
    RouterContext.useProvider({
      ...ctx,
      pathNodes: restNodes,
      rHistory
    })
    render()
  })
}


export type ImportDefault<T extends readonly any[]> = () => Promise<{
  default(...vs: T): void
}>
export function renderImportDefault(
  fun: ImportDefault<[]>,
  renderError: (err: any) => void,
  renderLoading: EmptyFun,
): void
export function renderImportDefault<T extends any[]>(
  fun: ImportDefault<T>,
  renderError: (err: any) => void,
  renderLoading: EmptyFun,
  ...vs: T): void
export function renderImportDefault(
  fun: ImportDefault<any[]>,
  renderError: (err: any) => void,
  renderLoading: EmptyFun,
  ...vs: any[]): void {
  const { data, loading } = useCallbackPromiseState(fun, emptyArray)
  renderOne(data?.type, () => {
    const type = data?.type
    if (type == 'success') {
      data!.value.default(...vs)
    } else if (type == 'error') {
      renderError(data?.value)
    } else {
      renderLoading()
    }
  })
}