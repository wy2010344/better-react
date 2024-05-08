import { createContext } from "better-react";
import { dom } from "better-react-dom";
import { renderIf, renderObject } from "better-react-helper";
import { EmptyFun, SetValue } from "wy-helper";




export type Page = (fun: SetValue<Page>) => void
export const GlobalContext = createContext<{
  mainPage: Page,
  setPage: SetValue<Page>
}>(undefined as any)


export function renderPage({
  title,
  onBack,
  bodyStyle
}: {
  title: string
  onBack?: EmptyFun
  bodyStyle?: string
}, renderBody: EmptyFun) {
  dom.div({
    style: `
    position:relative;
    width:100vw;
    height:100%;
    display:flex;
    flex-direction:column;
    align-items:stretch;
    `,
    onTouchMoveCapture(event) {
      event.preventDefault()
    },
  }).renderFragment(function () {
    dom.div({
      style: `
      display:flex;
      align-items:center;
      justify-content:space-between;
      padding:10px;
      padding-bottom:0;
      `
    }).renderFragment(function () {
      renderIf(onBack, function () {
        dom.button({
          onClick: onBack,
          style: `
        min-width:50px;
        `
        }).renderText`返回`
      }, function () {
        dom.div({
          style: `
        min-width:50px;
        `}).render()
      })
      dom.h1({
        style: `
        font-size:15px;
        `
      }).renderText`${title}`
      dom.div({
        style: `
        min-width:50px;
        `
      }).render()
    })
    dom.div({
      style: `
      flex:1;
      padding:10px;
      ${bodyStyle}
      `
    }).renderFragment(renderBody)
  })
}