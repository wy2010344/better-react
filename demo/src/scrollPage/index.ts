import { renderIf, useState } from "better-react-helper"
import { renderContent, useDom } from "better-react-dom";
import { normalPanel } from "../panel/PanelContext";
import ScrollTabPane from "./ScrollTabPane";

type TabKey = "A" | "B"
export default normalPanel(function (operate, id) {
  useDom("div", {
    children() {
      const [selected, setSelected] = useState<TabKey>("A")
      useDom("div", {
        css: `
        display:flex;
        `,
        children() {
          function tab(key: TabKey) {
            const isSelected = selected == key
            useDom("div", {
              onClick() {
                setSelected(key)
              },
              css: `
              flex:1;
              text-align:center;
              ${isSelected ? `
                background:blue;
                color:white;
                position:relative;
              `: `
              
              `}
              `,
              children() {
                renderContent(key)
                renderIf(isSelected, () => {
                  useDom("div", {
                    css: `
                    height:1px;
                    width:100%;
                    position:absolute;
                    background:white;
                    bottom:1px;
                    `
                  })
                })
              }
            })
          }
          tab("A")
          tab("B")
        }
      })
      ScrollTabPane<TabKey>({
        // containerCSS: `
        // height:200px;
        // `,
        shouldPage(width, x) {
          return 3 * x > width
        },
        selected,
        setSelected,
        tabs: [
          {
            key: "A",
            css: `
            height:200px;
            background:green;
            `,
            body() {
            }
          },
          {
            key: "B",
            css: `
            height:100px;
            background:red;
            `,
            body() {

            },
          }
        ],
      })
    }
  })
})