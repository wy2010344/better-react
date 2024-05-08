import { GlobalContext, renderPage } from "./util/page";
import { SetValue } from "wy-helper";
import { renderOne, useChange } from "better-react-helper";
import renderLkPage from "./util/renderLink";


export default function () {


  const [page, setPage] = useChange(mainPage)
  GlobalContext.hookProvider({
    setPage,
    mainPage
  })
  renderOne(page, () => page(setPage))
}
type Page = (fun: SetValue<Page>) => void
function mainPage(setPage: (v: SetValue<Page>) => void) {
  renderPage({
    title: "一些demo",
    bodyStyle: `
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    gap:10px;
    `
  }, function () {

    renderLkPage("拖动", () => import("./reorder"))
    renderLkPage("循环滚动", () => import("./centerPicker"))
    renderLkPage("scroller", () => import("./scroller"))
  })
}
