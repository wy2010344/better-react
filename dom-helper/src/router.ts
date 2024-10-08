import { createContext, renderStateHolder } from 'better-react'
import { renderOne, useCallbackPromiseState, useMemo, useMemoPromiseState } from 'better-react-helper'
import { emptyArray, emptyFun, EmptyFun, run } from 'wy-helper'
import { ThisRelativeHistory, MatchRule, RelativeHistory } from 'wy-helper/router'

type Page<T extends Record<string, string> = any> = (v: T) => void
export type Route = ({
  match: MatchRule
  getPage(): Promise<{
    default: Page
  }>
  page?: never
} | {
  match: MatchRule
  getPage?: never
  page: Page
}) & {
  renderError?: RenderError,
  renderLoading?: EmptyFun
}


export type RenderError = (v: any) => void

interface RouteConfig {
  routes: Route[],
  /**可以不要,就没有过渡期 */
  renderError?: RenderError,
  /**过渡中 */
  renderLoading?: EmptyFun
  /**未找到 */
  renderNotFound?(): void
  /**首次 */
  renderFirstLoading?(): void
}
/**
 * 需要将异步页面解放出来
 * 如果是异步页面,仍然渲染过去的页面,
 */
export function useRouter(
  {
    routes,
    renderNotFound = emptyFun,
    renderError = emptyFun,
    renderLoading,
    renderFirstLoading = renderLoading || emptyFun
  }: RouteConfig,
  pathNodes: readonly string[]
) {
  const [key, match] = useMemo(() => {
    for (let i = 0; i < routes.length; i++) {
      const route = routes[i]
      const out = route.match(pathNodes)
      if (out) {
        return [i, {
          out,
          route
        }]
      }
    }
    return [-1]
  }, pathNodes)

  const getPage = match?.route?.getPage
  const { data, loading } = useMemoPromiseState(() => {
    if (getPage) {
      return async () => {
        const render = await getPage()
        return {
          key,
          render: render.default
        }
      }
    }
  }, [getPage])
  return useMemo<{
    key: string
    loading: boolean,
    render: EmptyFun
  }, readonly any[]>(e => {
    let render: EmptyFun | undefined = undefined
    let keyPaths: any[] = [key]
    if (match) {
      const route = match.route
      const out = match.out

      const outMap = out.query
      const restNodes = out.restNodes
      const matchNodes = out.matchNodes
      if (route.page) {
        render = () => {
          renderWithIgnoreMore(
            matchNodes,
            restNodes,
            out.ignoreMore,
            () => {
              route.page!(outMap)
            })
        }
      }
      if (route.getPage) {
        if (data?.type == 'success' && data.value.key == key) {
          //当前异步
          keyPaths.push("success")
          render = () => {
            renderWithIgnoreMore(
              matchNodes,
              restNodes,
              out.ignoreMore,
              () => {
                data.value.render(outMap)
              })
          }
        }
        if (data?.type == 'error' && data.value.key == key) {
          //当前的异步
          keyPaths.push("error")
          render = () => {
            const render = route?.renderError || renderError
            renderWithIgnoreMore(
              matchNodes,
              restNodes,
              out.ignoreMore, () => {
                render(outMap)
              })
          }
        }
        const rLoading = route.renderLoading || renderLoading
        if (rLoading) {
          keyPaths.push("loading")
          render = rLoading
        }
      }
    } else {
      render = renderNotFound
    }
    if (render) {
      return {
        loading,
        key: keyPaths.join('-'),
        render
      }
    }
    const beforeValue = e.beforeValue
    if (beforeValue) {
      return beforeValue
    }
    return {
      key: "-2",
      loading,
      render: renderFirstLoading
    }
  }, [data, key, match])
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