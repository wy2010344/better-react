import renderLkPage from "../util/renderLink"
export default function () {


  renderLkPage("flushSync", () => import("./flushSync"))
  renderLkPage("reducer", () => import("./reducer"))
}