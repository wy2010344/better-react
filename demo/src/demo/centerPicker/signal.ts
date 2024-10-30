import { dom } from "better-react-dom";
import { renderPage } from "../util/page";
import { dragInit } from "wy-dom-helper";

export default function () {
  renderPage({
    title: "signal",
    bodyAttr: {
      onMouseMove(e) {
        e.preventDefault()
      }
    }
  }, () => {

    dom.div({
      className: 'flex items-center'
    }).render(() => {
      dom.div({
        className: "bg-white w-[300px] h-[300px] relative"
      }).render(() => {
        const div = dom.div({
          className: "absolute inset-0 select-none overflow-hidden",
          ...(dragInit((m, e) => {

          }))
        }).render(() => {
          const container = dom.div().render(() => {

          })
        })
      })
    })
  })
}