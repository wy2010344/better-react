import { hookAddResult, renderSubOps } from "better-react";
import { dom } from "better-react-dom";
import { renderPortal } from "better-react-dom";
import { useVersion } from "better-react-helper";

export default function () {


  const [version, updateVersion] = useVersion()
  const ops = renderSubOps(() => {
    dom.button({
      onClick: updateVersion
    }).renderText`abc`
  })

  dom.div({
    className: "bg-red-400 p-20"
  }).render(() => {
    if (version % 2) {
      console.log("aa")
      hookAddResult(ops)
    }
  })
  dom.div({
    className: "bg-green-400 p-20"
  }).render(() => {
    if (!(version % 2)) {
      hookAddResult(ops)
    }
  })

  const op2 = renderSubOps(() => {
    dom.button({
      onClick: updateVersion
    }).renderText`abcddd`
  })
  renderPortal(() => {
    hookAddResult(op2)
  }, document.body)
}