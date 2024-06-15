
import { emptyArray, emptyFun, emptyObject } from "wy-helper";
import { renderIf, renderOne, useCallbackPromiseState, useChange, useEffect } from "better-react-helper";
import { BrowserHistory, Location } from "history";
import { dom } from "better-react-dom";


type Page = (v: Record<string, string>) => void
type Match = (location: Location) => void | Record<string, string>
export type Route = {
  match: Match
} & ({
  getPage(): Promise<{
    default: Page
  }>
  page?: never
} | {
  getPage?: never
  page: Page
})
export function createRouter(
  routes: Route[],
  notFoun = emptyFun
) {
  function getPage(location: Location) {
    let outKey = -1
    let renderFun = notFoun
    let outMap = emptyObject
    for (let i = 0; i < routes.length; i++) {
      const route = routes[i]
      const out = route.match(location)
      if (out) {
        outMap = out
        outKey = i
        if (route.getPage) {
          renderFun = () => {
            const { data } = useCallbackPromiseState(route.getPage, emptyArray)
            renderOne(data?.type, () => {
              const type = data?.type
              if (type == 'success') {
                data!.value.default(out)
              } else if (type == 'error') {
                renderError(data?.value)
              } else {
                renderLoading()
              }
            })
          }
        } else {
          renderFun = () => {
            route.page(out)
          }
        }
        break
      }
    }
    return [renderFun, outKey] as const
  }
  return function (history: BrowserHistory) {
    const [[renderPage, key], setRenderPage] = useChange(history.location, getPage)
    useEffect(() => {
      return history.listen(e => {
        setRenderPage(getPage(e.location))
      })
    }, emptyArray)
    renderOne(key, renderPage)
  }
}

export function renderError(value: string) {
  dom.div({
    style: `
        position: fixed;
        width: 100%;
        height: 100%;
        display:flex;
        align-items:center;
        justify-content:center;
        `
  }).renderText`${value}`
}

export function renderLoading() {
  dom.div({

    style: `
        position: fixed;
        width: 100%;
        height: 100%;
        display:flex;
        align-items:center;
        justify-content:center;
        `
  }).renderText`Loading...`

}


export function locationMatch(queryPath: string, startWith?: boolean): Match {
  return function (location) {
    if (startWith) {
      if (location.pathname.startsWith(queryPath)) {
        return emptyObject
      }
    } else {
      if (location.pathname == queryPath) {
        return emptyObject
      }
    }
  }
}
