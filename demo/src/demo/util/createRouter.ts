
import { EmptyFun, emptyArray, emptyFun, emptyObject } from "wy-helper";
import { renderIf, renderOne, useCallbackPromiseState } from "better-react-helper";
import { Location } from "history";
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
export function createRouter(...routes: Route[]) {
  return function (location: Location) {
    let outKey = -1
    let renderFun = emptyFun
    let outMap = emptyObject
    for (let i = 0; i < routes.length; i++) {
      const route = routes[i]
      const out = route.match(location)
      if (out) {
        outMap = out
        outKey = i
        if (route.getPage) {
          renderFun = () => {
            const { data, loading } = useCallbackPromiseState(route.getPage, emptyArray)
            renderIf(loading, () => {
              dom.div().renderText`Loading...`
            })
            renderIf(data?.type == 'success', function () {
              data!.value.default()
            }, () => {
              dom.div().renderText`${data?.value}`
            })
          }
        } else {
          renderFun = route.page
        }
        break
      }
    }
    renderOne(outKey, function () {
      renderFun(outMap)
    })
  }
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

export function trueForEmpty(a: any) {
  if (a) {
    return emptyObject
  }
}