import renderLkPage from "../util/renderLink"
export default function () {


  renderLkPage("frame", () => import("./frame"))
  renderLkPage("css", () => import("./css"))
  renderLkPage("iScroll", () => import("./iscroll"))
  renderLkPage("cssRender", () => import("./cssRender"))
}