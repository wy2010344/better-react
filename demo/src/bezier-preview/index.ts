import { dom } from "better-react-dom";
import selfAdd from "./selfAdd";
import innerDefine from "./innerDefine";
import fnLines from "./fnLines";

export default function () {

  dom.div({
    style: `
    display:flex;
    align-items:stretch;
    overflow:auto;
    height:100vh;
    `
  }).render(function () {
    dom.div({
    }).render(function () {
      fnLines()
    })

    dom.div({
    }).render(function () {
      innerDefine()
    })

    dom.div({
    }).render(function () {
      selfAdd()
    })
  })

}