import { dom } from "better-react-dom"
import { EmptyFun, emptyArray } from "wy-helper"
import { GlobalContext, renderPage } from "./page"
import { renderIf, useCallbackPromiseState, useMemoPromiseState } from "better-react-helper"
import { History } from 'history'


export default function renderLkPage(title: string, onClick: (history: History) => void) {
  const { history } = GlobalContext.useConsumer()
  renderA(title, () => {
    onClick(history)
  })
}



function renderA(text: string, onClick: EmptyFun) {

  dom.a({
    onClick,
    href: "javascript:void(0)"
  }).renderTextContent(text)
}