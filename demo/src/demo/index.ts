import { GlobalContext, renderPage } from "./util/page";
import { EmptyFun, SetValue, emptyArray, emptyFun } from "wy-helper";
import { renderFragment, renderGuard, renderIf, renderOne, useCallbackPromiseState, useChange, useEffect, useMemo } from "better-react-helper";
import renderLkPage from "./util/renderLink";
import { createBrowserHistory, Location } from "history";
import { dom } from "better-react-dom";
import { createRouter, locationMatch, trueForEmpty } from "./util/createRouter";
import { reorderRoutes } from "./reorder";
import { centerPickerRoutes } from "./centerPicker";
import { scrollerRoutes } from "./scroller";
import { pageRoutes } from "./page";


export default function () {
  const history = useMemo(() => {
    return createBrowserHistory()
  }, emptyArray)
  const [location, setRouter] = useChange(history.location)
  useEffect(() => {
    history.listen((update) => {
      setRouter(update.location)
    })
  }, emptyArray)
  GlobalContext.hookProvider({
    history
  })
  console.log(location)
  renderRouter(location)
  // renderFragment(function () {

  // }, location)
}
function mainPage() {
  renderPage({
    title: "一些demo",
  }, function () {


    renderLkPage("拖动", (history) => history.push('/reorder'))
    renderLkPage("循环滚动", history => history.push("/centerPicker"))
    renderLkPage("scroller", history => history.push("./scroller"))
    renderLkPage("page", history => history.push("./page"))
    renderLkPage("layoutAnimation", history => history.push("./layoutAnimation"))
    renderLkPage("bookview", history => history.push("./bookview"))
    renderLkPage("circleChoose", history => history.push("./circleChoose"))
    renderLkPage("pulltoRefresh", history => history.push("./pulltoRefresh"))
    renderLkPage("taro", history => history.push("./taro"))
  })
}



const renderRouter = createRouter(
  {
    match(location) {
      return trueForEmpty(location.pathname == '/')
    },
    page: mainPage
  },
  ...reorderRoutes,
  ...centerPickerRoutes,
  ...scrollerRoutes,
  ...pageRoutes,
  {
    match: locationMatch("/pulltoRefresh"),
    getPage() {
      return import("./pulltoRefresh")
    },
  },
  {
    match: locationMatch("/layoutAnimation"),
    getPage() {
      return import("./layoutAnimation")
    },
  },
  {
    match: locationMatch("/bookview"),
    getPage() {
      return import("./bookView")
    },
  },
  {
    match: locationMatch("/circleChoose"),
    getPage() {
      return import("./circleChoose")
    },
  },
  {
    match: locationMatch("/taro"),
    getPage() {
      return import("./taro")
    },
  },
)
