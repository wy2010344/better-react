import { GlobalContext, renderPage } from "./util/page";
import { EmptyFun, SetValue, emptyArray, emptyFun } from "wy-helper";
import { renderFragment, renderGuard, renderIf, renderOne, useCallbackPromiseState, useChange, useEffect, useMemo } from "better-react-helper";
import renderLkPage from "./util/renderLink";
import { createBrowserHistory, Location } from "history";
import { dom } from "better-react-dom";
import { createRouter, locationMatch } from "./util/createRouter";
import { reorderRoutes } from "./reorder";
import { centerPickerRoutes } from "./centerPicker";
import { scrollerRoutes } from "./scroller";
import { pageRoutes } from "./page";
import onboard from "./onboard";
import note from './note'
import { cns } from "wy-dom-helper";
import { tw } from "@/utils";

export default function () {
  const history = useMemo(() => {
    return createBrowserHistory()
  }, emptyArray)
  GlobalContext.useProvider({
    history
  })
  renderRouter(history)
  // renderFragment(function () {

  // }, location)
}
function mainPage() {
  const className = "bg-blue-500 text-white p-4 rounded text";
  const nv = tw`
text-bold ${'text-gray text-ellipsis'}
`
  const styles = tw`
  text-bold text-3xl underline text-slate-50
`;
  const ns = cns('text-gray-50')
  renderPage({
    title: "一些demo",
  }, function () {
    dom.div({
      className: `
      text-bold text-slate-50
      `
    })
    dom.h1(v => {
      v.className = tw`text-3xl font-bold underline text-slate-50 text`
    }).renderText`Hello World`
    renderLkPage("拖动", (history) => history.push('/reorder'))
    renderLkPage("循环滚动", history => history.push("/centerPicker"))
    renderLkPage("scroller", history => history.push("./scroller"))
    renderLkPage("page", history => history.push("./page"))
    renderLkPage("layoutAnimation", history => history.push("./layoutAnimation"))
    renderLkPage("bookview", history => history.push("./bookview"))
    renderLkPage("circleChoose", history => history.push("./circleChoose"))
    renderLkPage("pulltoRefresh", history => history.push("./pulltoRefresh"))
    renderLkPage("taro", history => history.push("./taro"))
    renderLkPage("onboard", history => history.push("./onboard"))
    renderLkPage("card", history => history.push("./card"))
    renderLkPage("note", history => history.push("./note"))
  })
}



const renderRouter = createRouter([
  {
    match: locationMatch("/"),
    page: mainPage
  },
  ...reorderRoutes,
  ...centerPickerRoutes,
  ...scrollerRoutes,
  ...pageRoutes,
  ...onboard,
  ...note,
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
  {
    match: locationMatch("/card"),
    getPage() {
      return import("./hoverCard")
    },
  }
])
