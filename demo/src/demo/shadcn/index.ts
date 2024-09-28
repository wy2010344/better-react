import { dom } from "better-react-dom";
import { renderPage } from "../util/page";
import { buttonVariants } from "./components/button";
import { cn } from "@/utils";
import renderLkPage from "../util/renderLink";
import { Route } from "better-react-dom-helper";
import { locationMatch } from "wy-helper/router";



export const shadcnRoutes: Route[] = [
  {
    match: locationMatch("/shadcn"),
    page(v) {
      renderPage({
        title: "shadcn"
      }, () => {
        renderLkPage("tabs", history => history.push("/shadcn/tabs"))
        renderLkPage("menubar", history => history.push("/shadcn/menubar"))
      })
    },
  },
  {
    match: locationMatch("/shadcn/tabs"),
    getPage() {
      return import("./demos/tabs1")
    },
  },
  {
    match: locationMatch("/shadcn/menubar"),
    getPage() {
      return import("./demos/menubar1")
    },
  },
]