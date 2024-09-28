
import { emptyArray, emptyObject } from "wy-helper";
import { renderOne, useChange, useEffect, useMemo } from "better-react-helper";
import { BrowserHistory, createBrowserHistory, Location } from "history";
import { dom } from "better-react-dom";

import { getPathNodes, RootRelativeHistory } from 'wy-helper/router'
import { RouterContext } from "better-react-dom-helper";
import { GlobalContext } from "./page";

function createHistory() {
  const history = createBrowserHistory()
  return {
    history,
    rHistory: new RootRelativeHistory(history)
  }
}

export function useHistory() {
  const { history, rHistory } = useMemo(createHistory, emptyArray)
  const [location, setRouter] = useChange(history.location)
  useEffect(() => {
    history.listen((update) => {
      setRouter(update.location)
    })
  }, emptyArray)
  const pathNodes = useMemo(() => {
    return getPathNodes(location.pathname)
  }, location.pathname)
  GlobalContext.useProvider({
    history,
    location
  })
  RouterContext.useProvider({
    pathNodes,
    rHistory
  })
  return pathNodes as readonly string[]
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
