import { Route, locationMatch } from "../util/createRouter"
import { renderPage } from "../util/page"
import renderLkPage from "../util/renderLink"
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
  }
]