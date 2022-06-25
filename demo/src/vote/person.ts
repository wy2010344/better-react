import { useContent, useDom } from "better-react-dom";
import { useRef } from "better-react-helper";
import { useUser } from "../dbStore";
import { normalPanel } from "../panel/PanelContext";

export default normalPanel(function (operate, id) {
  const user = useUser()
  useDom("div", {
    children() {
      const input = useDom("input")
      useDom("button", {
        onClick() {
          const err = user.add(input.value)
          if (err) {
            alert(err)
            return
          }
          input.value = ''
        },
        children() {
          useContent("增加人物")
        }
      })
    }
  })
})