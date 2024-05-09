import { Route, locationMatch } from "../util/createRouter"
import { renderPage } from "../util/page"
import renderLkPage from "../util/renderLink"
export default function () {


}



export const scrollerRoutes: Route[] = [
  {
    match: locationMatch("/scroller"),
    page(v) {
      renderPage({
        title: "scroller"
      }, () => {
        renderLkPage("frame", history => history.push("/scroller/frame"))
        renderLkPage("css", history => history.push("/scroller/css"))
        renderLkPage("iScroll", history => history.push("/scroller/iscroll"))
        renderLkPage("cssRender", history => history.push("/scroller/cssRender"))
      })
    },
  },
  {
    match: locationMatch("/scroller/frame"),
    getPage() {
      return import("./frame")
    },
  },
  {
    match: locationMatch("/scroller/css"),
    getPage() {
      return import("./css")
    },
  },
  {
    match: locationMatch("/scroller/iscroll"),
    getPage() {
      return import("./iscroll")
    },
  },
  {
    match: locationMatch("/scroller/cssRender"),
    getPage() {
      return import("./cssRender")
    },
  }
]