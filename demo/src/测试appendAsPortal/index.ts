import { domOf, portalDomOf } from "better-react-dom";
import { normalPanel } from "../panel/PanelContext";
import { EmptyFun, useEffect } from "better-react";
import { renderIf, useVersion } from "better-react-helper";


function AComponent(children: EmptyFun) {
  domOf("div", {
    style: `background:green;`
  }).render(function () {

    const [version, updateVersion] = useVersion(2)

    const abc = domOf("div", {
      id: "abc"
    }).render()

    const bcd = domOf("div", {
      id: "bcd"
    }).render()

    let match = version % 4
    renderIf(match, function () {
      useEffect(() => {
        if (match == 1) {
          abc.appendChild(div)
        } else if (match == 2) {
          bcd.appendChild(div)
        } else if (match == 3) {
          document.body.appendChild(div)
        }
      }, [match])
      const div = portalDomOf("div", {
        style: `
      background:red;
      `
      }).render(function () {
        useEffect(() => {
          console.log("portal初始化")
          return function () {
            console.log("portal销毁")
          }
        }, [])
        domOf("div").renderTextContent(`这是portal上的内容`)

        children()
      })
    })
    domOf("button", {
      onClick() {
        updateVersion()
      }
    }).renderTextContent("点击" + match)
  })
}

export default normalPanel(function () {
  AComponent(function () {
    AComponent(function () {

    })
  })
})