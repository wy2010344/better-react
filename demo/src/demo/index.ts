import { dom } from "better-react-dom";
import { renderPage } from "./util/page";
import { EmptyFun, SetValue } from "wy-helper";
import { renderIf, renderOne, useChange } from "better-react-helper";
import reorderList from "./reorderList";
import centerPickerReducer from "./centerPicker-reducer";
import centerPickerFlushSync from "./centerPicker-flushSync";
import reorderListReducer from "./reorderList-reducer";


export default function () {


  const [page, setPage] = useChange(mainPage)
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


    function renderLkPage(title: string, content: EmptyFun) {
      renderA(title, () => {
        setPage(function () {
          renderPage({
            onBack() {
              setPage(mainPage)
            },
            title,
            bodyStyle: `
            display:flex;
            flex-direction:column;
            align-items:center;
            justify-content:center;
            gap:10px;
            min-height:0;
          `
          }, content)
        })
      })
    }
    renderLkPage("滚动", reorderList)
    renderLkPage("滚动-reducer", reorderListReducer)
    renderLkPage("循环滚动-reducer", centerPickerReducer)
    renderLkPage("循环滚动-flushSync", centerPickerFlushSync)

  })
}


function renderA(text: string, onClick: EmptyFun) {

  dom.a({
    onClick,
    href: "javascript:void(0)"
  }).renderTextContent(text)
}