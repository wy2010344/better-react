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
  }).renderFragment(function () {
    dom.div({
    }).renderFragment(function () {
      fnLines()
    })

    dom.div({
    }).renderFragment(function () {
      innerDefine()
    })

    dom.div({
    }).renderFragment(function () {
      selfAdd()
    })
  })

}