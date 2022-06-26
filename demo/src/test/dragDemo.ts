import { useState } from "better-react";
import { useDom } from "better-react-dom";
import { normalPanel } from "../panel/PanelContext";

export default normalPanel(function (operate, id) {
  useDom("div", {
    children() {


      const [onDrag, setOnDrag] = useState(false)
      useDom("div", {
        draggable: true,
        onDragStart(e) {
          console.log("start-drag")
          setOnDrag(true)
        },
        onDragEnd(e) {
          console.log("drag-end")
          setOnDrag(false)
        },
        css: `
        width:100px;
        height:20px;
        border:1px solid black;
        `,
        style: {
          background: onDrag ? "blue" : "yellow",
          //visibility: onDrag ? "hidden" : "visible"
          //opacity: onDrag ? 0.5 : 1,
          //display: onDrag ? "none" : ""
        }
      })

      useDom("div", {
        onDragOver(e) {
          e.preventDefault()

        },
        onDrop(e) {
          e.preventDefault()
        },
        css: `
        background:green;
        width:200px;
        height:200px;
        `
      })
    }
  })
})