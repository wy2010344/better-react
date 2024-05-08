import renderLkPage from "../util/renderLink"
export default function () {


  renderLkPage("frame", () => import("./frame"))
  renderLkPage("reducer", () => import("./reducer"))
}