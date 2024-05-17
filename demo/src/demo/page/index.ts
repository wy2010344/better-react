import { Route, locationMatch } from "../util/createRouter";
import { renderPage } from "../util/page";
import renderLkPage from "../util/renderLink";





export const pageRoutes: Route[] = [
  {
    match: locationMatch("/page"),
    page(v) {
      renderPage({
        title: "Page"
      }, () => {

        renderLkPage("简单page", history => history.push("/page/simple"))

        renderLkPage("稍复杂1", history => history.push("/page/complex1"))
      })
    },
  },
  {
    match: locationMatch("/page/simple"),
    getPage() {
      return import("./simple")
    },
  },
  {
    match: locationMatch("/page/complex1"),
    getPage() {
      return import("./complex1")
    },
  },
]