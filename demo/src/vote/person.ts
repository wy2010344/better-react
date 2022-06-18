import { useContent, useDom } from "better-react-dom";
import { useRef } from "better-react-helper";
import { useUser } from "../dbStore";
import { normalPanel } from "../panel/PanelContext";

export default normalPanel(function (operate, id) {
  const user = useUser()
  useDom("div", {
    children() {
      const inputRef = useRef<HTMLInputElement | undefined>(undefined)
      useDom("input", {
        ref: inputRef.set
      })
      useDom("button", {
        onClick() {
          const input = inputRef.get()
          if (input) {
            const err = user.add(input.value)
            if (err) {
              alert(err)
              return
            }
            input.value = ''
          }
        },
        children() {
          useContent("增加人物")
        }
      })
    }
  })
})