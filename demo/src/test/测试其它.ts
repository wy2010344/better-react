import { useState } from "better-react-helper";
import { renderContent, useDom, useSvg } from "better-react-dom";
import { normalPanel } from "../panel/PanelContext";
import { stringifyStyle } from "wy-dom-helper";

export default normalPanel(function (operate, id) {
  useDom("div", {

    children() {
      useSvg("svg", {
        // innerHTML: `
        // <rect width="200" height="300" fill="blue"/>
        // `,
        children() {
          useSvg("text", {
            x: 100,
            y: 100,
            textContent: "vds",
          })
          renderContent("bcd")
          useSvg("g", {
            // width: 400,
            // height: 500,
            // fill: "green",
            innerHTML: `<rect width="200" height="300" fill="blue"/>`
            // children() {
            //   useSvg("text", {
            //     x: 100,
            //     y: 100,
            //     textContent: "vds",
            //   })
            // },
          })
        },
      })
    },
  })
  useDom("input", {
    style: stringifyStyle({
      minHeight: "1rem"
    }),
    //contentEditable: "plaintext-only",
    onChange(event) {
      console.log("change")
    },
    onInput(event) {
      console.log("change-input")
    },
  })
  useDom("div", {
    style: stringifyStyle({
      minHeight: "1rem"
    }),
    contentEditable: "plaintext-only",
    // onChange(event) {
    //   console.log("change")
    // },
    onInput(event) {
      console.log("change-input")
    },
  })

  测试css动画()
})



function 测试css动画() {
  useDom("div", {
    children() {

      const [width, setWidth] = useState(300)
      const [scaleY, setScaleY] = useState(0)
      dom.button({
        textContent: "添加动画",
        onClick() {
          setWidth(w => w - 20)
          setScaleY(v => v == 0 ? 1 : 0)
        }
      })

      useDom("div", {
        onTransitionEnd(event) {
          console.log("end--", width)
        },
        style: stringifyStyle({
          width: width + 'px',
          height: width + 'px',
          background: "green",
          // transform: `scaleY(${scaleY})`,
          transition: 'all ease 2s'
        })
      })
    },
  })
}