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
        renderLkPage("frame", history => history.push("/reorder/frame"))
        renderLkPage("reducer", history => history.push("/reorder/reducer"))
        renderLkPage("gap", history => history.push("/reorder/gap"))
        renderLkPage("gapFrame", history => history.push("/reorder/gapFrame"))
      })
    }
  },
  {
    match: locationMatch("/reorder/frame"),
    getPage() {
      return import("./frame")
    },
  },
  {
    match: locationMatch("/reorder/reducer"),
    getPage() {
      return import("./reducer")
    },
  },
  {
    match: locationMatch("/reorder/gap"),
    getPage() {
      return import("./gap")
    },
  },
  {
    match: locationMatch("/reorder/gapFrame"),
    getPage() {
      return import("./gapFrame")
    },
  },
]