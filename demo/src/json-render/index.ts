import { normalPanel, PanelContext } from "../panel/PanelContext";
import { evaluate } from "./evaluate";

export default normalPanel(function () {


  evaluate({
    type: "call",
    fun: "Button",
    args: {
      onClick: {
        type: "event",
        body: [
          {
            type: "call",
            fun: "alert",
            args: {
              content: "OK"
            }
          }
        ]
      },
      children: [
        {
          type: "call",
          fun: "Text",
          args: {
            content: "点击"
          }
        }
      ]
    }
  })
})