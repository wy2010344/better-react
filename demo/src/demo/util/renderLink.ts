import { dom } from "better-react-dom"
import { EmptyFun, emptyArray } from "wy-helper"
import { GlobalContext, renderPage } from "./page"
import { renderIf, useCallbackPromiseState, useMemoPromiseState } from "better-react-helper"



export default function renderLkPage(title: string, content: () => Promise<{
  default: EmptyFun
}>) {
  const { setPage, mainPage } = GlobalContext.useConsumer()
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
            position:relative;
          `
      }, () => {
        const { data, loading } = useCallbackPromiseState(content, emptyArray)
        renderIf(loading, () => {
          dom.div().renderText`Loading...`
        })
        renderIf(data?.type == 'success', function () {
          data!.value.default()
        }, () => {
          dom.div().renderText`${data?.value}`
        })
      })
    })
  })
}



function renderA(text: string, onClick: EmptyFun) {

  dom.a({
    onClick,
    href: "javascript:void(0)"
  }).renderTextContent(text)
}