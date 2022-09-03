import { useContent, useDom, useSvg } from "better-react-dom";
import { normalPanel } from "../panel/PanelContext";

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
          useContent("bcd")
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
    style: {
      minHeight: "1rem"
    },
    //contentEditable: "plaintext-only",
    onChange(event) {
      console.log("change")
    },
    onInput(event) {
      console.log("change-input")
    },
  })
  useDom("div", {
    style: {
      minHeight: "1rem"
    },
    contentEditable: "plaintext-only",
    // onChange(event) {
    //   console.log("change")
    // },
    onInput(event) {
      console.log("change-input")
    },
  })
})
