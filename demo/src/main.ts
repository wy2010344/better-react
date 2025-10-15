import { createRoot } from "better-react-dom";
import { getScheduleAskTime } from "wy-helper";
import { createSimpleTree } from "better-react-helper";
import { useLocation } from "./history";

const pages = import.meta.glob("./pages/**");
const { renderBranch } = createSimpleTree({
  pages,
  prefix: "./pages/",
  renderError(err) {
    return `error:${err}`;
  },
});
const app = document.getElementById("app")!;
const destroy = createRoot(
  app,
  () => {
    // countDemo()
    // todoDemo()
    // animationDemo()
    const { pathname } = useLocation();
    renderBranch(pathname);
  },
  getScheduleAskTime(),
);
window.addEventListener("unload", destroy);
