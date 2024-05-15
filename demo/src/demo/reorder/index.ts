import { Route, locationMatch } from "../util/createRouter"
import { renderPage } from "../util/page"
import renderLkPage from "../util/renderLink"
export const reorderRoutes: Route[] = [
  {
    match: locationMatch("/reorder"),
    page() {
      renderPage({
        title: "reorder",
      }, () => {
        renderLkPage("css", history => history.push("/reorder/css"))
        renderLkPage("reducer", history => history.push("/reorder/reducer"))
        renderLkPage("gapCss", history => history.push("/reorder/gapCss"))
        renderLkPage("gapFrame", history => history.push("/reorder/gapFrame"))
        // renderLkPage("reducerNew", history => history.push("/reorder/reducerNew"))
      })
    }
  },
  {
    match: locationMatch("/reorder/css"),
    getPage() {
      return import("./css")
    },
  },
  {
    match: locationMatch("/reorder/reducer"),
    getPage() {
      return import("./reducer")
    },
  },
  {
    match: locationMatch("/reorder/gapCss"),
    getPage() {
      return import("./gapCss")
    },
  },
  {
    match: locationMatch("/reorder/gapFrame"),
    getPage() {
      return import("./gapFrame")
    },
  },
  {
    match: locationMatch("/reorder/reducerNew"),
    getPage() {
      return import("./reducerNew")
    },
  },
]