import { render } from "./core";
import { FiberNode } from "./dom/updateDom";
import { ScheduleAskTime } from "./dom/schedule";
import { useContent, useDom } from "./dom";
import { useState } from "./core/fc";


const node = FiberNode.create(document.getElementById("app")!)
const destroy = render(
  function () {
    useDom("div", {
      onClick() {
        console.log("点击")
      },
      style: {
        width: "100px",
        height: "100px",
        backgroundColor: "green"
      },
      children() {
        useDom("div", {
          style: {
            width: "20px",
            height: "30px",
            backgroundColor: "blue"
          }
        })
        const [count, setCount] = useState(() => 9)

        useDom("button", {
          onClick() {
            setCount(count + 1)
          },
          children() {
            useContent(`点击了${count}次`)
          }
        })
      }
    })
  },
  node,
  //askTimeWork,
  //askIdleTimeWork,
  ScheduleAskTime
);