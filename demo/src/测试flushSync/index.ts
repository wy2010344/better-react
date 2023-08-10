import { renderIf, useChange } from "better-react-helper";
import { normalPanel } from "../panel/PanelContext";
import { renderInput, useClickOutside } from "better-react-dom-helper";
import { domOf } from "better-react-dom";

export default normalPanel(function () {
  const [open, setOpen] = useChange(false)
  const [value, setValue] = useChange('134567')

  domOf("div", {
    onMouseDown(event) {
      console.log("div-onMouseDown")
    },
    onMouseUp(event) {
      console.log("div-onMouseUp")
    },
    onMouseDownCapture(e) {
      console.log("div-onMouseDownCapture")

    },
    onMouseUpCapture(event) {

      console.log("div-onMouseUpCapture")
    },
    onClick(event) {
      console.log("div-onClick")
    },
    onClickCapture(event) {
      console.log("div-onClickCapture")
    },
  }).render(function () {

    renderIf(open, function () {

      useClickOutside(e => input.contains(e), function () {
        console.log("input--")
        setOpen(false)
      })
      const input = renderInput("input", {
        value,
        onValueChange: setValue
      })
    }, function () {
      domOf("button", {
        onMouseDown(event) {
          console.log("onMouseDown")
        },
        onMouseUp(event) {
          console.log("onMouseUp")
        },
        onMouseDownCapture(e) {
          console.log("onMouseDownCapture")

        },
        onMouseUpCapture(event) {

          console.log("onMouseUpCapture")
        },
        onClick(e) {
          console.log("click")
          // e.stopPropagation()
        },
        onClickCapture(e) {
          console.log("onClickCapture")
          setOpen(true)
        }
      }).renderTextContent(value)
    })
  })
})