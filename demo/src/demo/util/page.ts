import { createContext } from "better-react";
import { dom } from "better-react-dom";
import { renderIf, renderObject } from "better-react-helper";
import { BrowserHistory, Location } from "history";
import { DomAttribute } from "wy-dom-helper";
import { EmptyFun, SetValue } from "wy-helper";




// export type Page = (fun: SetValue<Page>) => void
export const GlobalContext = createContext<{
  history: BrowserHistory
  location: Location
}>(undefined as any)


export function renderPage({
  title,
  onBack,
  bodyStyle,
  bodyAttr,
  renderRight
}: {
  title: string
  onBack?: EmptyFun
  bodyStyle?: string
  bodyAttr?: DomAttribute<"div">,
  renderRight?: EmptyFun
}, renderBody: (div: HTMLElement) => void) {
  const { history } = GlobalContext.useConsumer()
  onBack = onBack || (() => {
    history.back()
  });
  dom.div({
    style: `
    position:relative;
    width:100vw;
    height:100%;
    display:flex;
    flex-direction:column;
    align-items:stretch;
    `,
  }).render(function () {
    dom.div({
      style: `
      display:flex;
      align-items:center;
      justify-content:space-between;
      padding:10px;
      padding-bottom:0;
      `
    }).render(function () {
      dom.button({
        onClick: onBack,
        style: `
        min-width:50px;
        `
      }).renderText`返回`
      dom.h1({
        style: `
        font-size:15px;
        `
      }).renderText`${title}`
      dom.div({
        style: `
        min-width:50px;
        `
      }).render(renderRight)
    })
    dom.div({
      ...bodyAttr,
      style: `
      flex:1;
      padding:10px;
      display:flex;
      flex-direction:column;
      align-items:center;
      justify-content:center;
      gap:10px;
      min-height:0;
      position:relative;
      ${bodyStyle}
      `
    }).render(renderBody)
  })
}