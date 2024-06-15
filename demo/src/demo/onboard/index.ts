import Lottie from "lottie-web";
import { Route, locationMatch } from "../util/createRouter";
import { renderPage } from "../util/page";
import renderLkPage from "../util/renderLink";
import data from "./1/data";



export default [
  {
    match: locationMatch("/onboard"),
    page(v) {
      renderPage({
        title: "Onboard"
      }, () => {
        renderLkPage("onBoard1", history => history.push("/onboard/1"))
      })
    },
  },
  {
    match: locationMatch("/onboard/1"),
    getPage() {
      return import("./1")
    },
  }
] as Route[]