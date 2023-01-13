import { useMap } from "better-react";
import { useContent, useDom } from "better-react-dom";
import { useRef } from "better-react-helper";
import { useUser } from "../dbStore";
import { normalPanel } from "../panel/PanelContext";
import { useInput } from "better-react-dom-helper";

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
  useDom("div", {
    children() {
      const { users, update } = useUser()

      useDom("table", {
        children() {
          useDom("thead", {
            children() {
              useDom("tr", {
                children() {
                  useDom("th", {
                    textContent: "姓名"
                  })
                  useDom("th", {
                    textContent: "颜色"
                  })
                },
              })
            },
          })
          useDom("tbody", {
            children() {
              useMap(users, v => v.name, user => {
                useDom("tr", {
                  children() {
                    useDom("td", {
                      textContent: user.name
                    })
                    useDom("td", {
                      children() {
                        useInput("input", {
                          type: "color",
                          value: user.color || "#000000",
                          onValueChange(v) {
                            update(user.name, {
                              color: v
                            })
                          },
                        })
                      },
                    })
                  }
                })
              })
            },
          })
        },
      })
    }
  })
})