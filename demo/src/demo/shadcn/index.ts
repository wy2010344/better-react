import { dom } from "better-react-dom";
import { locationMatch, Route } from "../util/createRouter";
import { renderPage } from "../util/page";
import { buttonVariants } from "./components/button";
import { cn } from "@/utils";
import renderLkPage from "../util/renderLink";



export const shadcnRoutes: Route[] = [
  {
    match: locationMatch("/shadcn"),
    page(v) {
      renderPage({
        title: "shadcn"
      }, () => {
        renderLkPage("tabs", history => history.push("/shadcn/tabs"))
      })
    },
  },
  {
    match: locationMatch("/shadcn/tabs"),
    getPage() {
      return import("./demos/tabs1")
    },
  },
]