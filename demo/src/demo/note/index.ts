import { useEffect } from "better-react-helper";
import { Route, locationMatch } from "../util/createRouter";
import { renderPage } from "../util/page";
import { emptyArray, run } from "wy-helper";
import { idbOut } from "./idbUtil";
import { initDexieUtil } from "./dexieUtil";

const routes: Route[] = [
  {
    match: locationMatch('/note'),
    page(v) {
      renderPage({
        title: "笔记"
      }, () => {

        useEffect(() => {
          initDexieUtil()
        }, emptyArray)
      })
    },
  }
]

export default routes