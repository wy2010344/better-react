import { Route } from "better-react-dom-helper"
import { renderPage } from "../util/page"
import renderLkPage from "../util/renderLink"
import { locationMatch } from "wy-helper/router"
export default function () {


}



export const centerPickerRoutes: Route[] = [

  {
    match: locationMatch("/centerPicker"),
    page(v) {
      renderPage({
        title: "centerPicker"
      }, () => {
        renderLkPage("flushSync", history => history.push("/centerPicker/flushSync"))
        renderLkPage("reducer", history => history.push("/centerPicker/reducer"))
        renderLkPage("signal", history => history.push("/centerPicker/signal"))
      })
    },
  },
  {
    match: locationMatch("/centerPicker/flushSync"),
    getPage() {
      return import("./flushSync")
    },
  },
  {
    match: locationMatch("/centerPicker/reducer"),
    getPage() {
      return import("./reducer")
    },
  },
  {
    match: locationMatch("/centerPicker/signal"),
    getPage() {
      return import("./signal")
    },
  }
]