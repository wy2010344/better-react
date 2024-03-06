import { useEffect } from "better-react-helper"
import { renderFragment, renderGuard, renderGuardString, useState, } from "better-react-helper"
import { dom, domOf, renderContent, useDom } from "better-react-dom";
import dsl from "./dsl";
import ExpensiveView from "./ExpensiveView";
import FlexAbc from "./FlexAbc";
// import motionOne from "./motion-one";
import { CountContext, PanelContext, normalPanel } from "./panel/PanelContext";
import usePanel from "./panel/renderPanel";
import popup from "./popup";
import scrollPage from "./scrollPage";
import dragDemo from "./test/dragDemo";
import 测试renderOne from "./test/测试useOne";
import 测试其它 from "./test/测试其它";
import todoList from "./todoList/index";
import typeSystem from "./typeSystem";
import vote from "./vote";
import 设计系统 from "./设计系统";
import figmaClone from "./figmaClone";
import sReact from "./s-react";
import 文件系统整理 from "./文件系统整理";
import xmlToBetter from "./xmlToBetter";
import 测试Input from "./test/测试Input";
import 测试appendAsPortal from "./测试appendAsPortal";
import 测试sharePortal from "./测试sharePortal";
import 测试tooltip from "./测试tooltip";
import 测试flushSync from "./测试flushSync";
import JserPopOver from "./测试tooltip/JserPopOver";


export default normalPanel(function (operate) {

  renderContent("root")
  renderFragment(TestButtonPage, [])
  dom.button({
    onClick(e) {
      e.stopPropagation()
      dsl(operate)
    }
  }).renderText`进入DSL`
  dom.button({
    onClick(e) {
      e.stopPropagation()
      ExpensiveView(operate)
    }
  }).renderText`进入ExpansiveView`
  domOf("button", {
    onClick(e) {
      e.stopPropagation()
      测试appendAsPortal(operate)
    }
  }).renderTextContent("测试appendAsPortal")
  dom.button({
    onClick(e) {
      e.stopPropagation()
      FlexAbc(operate)
    }
  }).renderText`FlexAbc`
  dom.button({
    onClick(e) {
      e.stopPropagation()
      sReact(operate)
    }
  }).renderText`s-react`
  dom.button({
    onClick(e) {
      e.stopPropagation()
      测试其它(operate)
    }
  }).renderText`测试其它`
  dom.button({
    onClick(e) {
      e.stopPropagation()
      vote(operate)
    }
  }).renderText`vote`
  dom.button({
    onClick(e) {
      e.stopPropagation()
      typeSystem(operate)
    },
    textContent: "typeSystem"
  })
  dom.button({
    onClick(e) {
      e.stopPropagation()
      figmaClone(operate)
    },
    textContent: "figmaClone"
  })

  dom.button({
    onClick(e) {
      e.stopPropagation()
      xmlToBetter(operate)
    },
    textContent: "xmlToBetter"
  })
  dom.button({
    onClick(e) {
      e.stopPropagation()
      设计系统(operate)
    },
    textContent: "设计系统"
  })
  dom.button({
    onClick(e) {
      e.stopPropagation()
      todoList(operate)
    },
    children() {
      renderContent("todoList")
    }
  })
  // dom.button( {
  //   onClick(e) {
  //     e.stopPropagation()
  //     motionOne(operate)
  //   },
  //   children() {
  //     renderContent("motion-one")
  //   }
  // })
  dom.button({
    onClick(e) {
      e.stopPropagation()
      scrollPage(operate)
    }
  }).renderText`scroll-page`
  dom.button({
    onClick(e) {
      e.stopPropagation()
      popup(operate)
    }
  }).renderText`popup`

  dom.button({
    onClick(e) {
      e.stopPropagation()
      测试Input(operate)
    }
  }).renderText`测试input`
  dom.button({
    onClick(e) {
      e.stopPropagation()
      测试renderOne(operate)
    }
  }).renderText`测试renderOne`
  Demo()
  // Action()
  //console.log("在这里")

  const value = CountContext.useConsumer()
  renderContent(`在这里${value}`)


  dom.button({
    onClick(e) {
      e.stopPropagation()
      dragDemo(operate)
    }
  }).renderText`drag-demo`
  dom.button({
    onClick(event) {
      event.stopPropagation()
      文件系统整理(operate)
    }
  }).renderText`文件系统整理`
  domOf("button", {
    onClick(event) {
      event.stopPropagation()
      测试tooltip(operate)
    },
  }).renderTextContent("测试tooltip")
  domOf("button", {
    onClick(event) {
      event.stopPropagation()
      测试flushSync(operate)
    },
  }).renderTextContent("测试flushsync")
  domOf("button", {
    onClick(event) {
      event.stopPropagation()
      JserPopOver(operate)
    },
  }).renderTextContent("JserPopOver")
})

function TestButtonPage() {
  const operate = PanelContext.useConsumer()
  const [thisId, setThisId] = useState(-1)
  console.log("renderId", thisId)
  useEffect(() => {
    return () => {
      console.log("销毁了?", thisId)
      operate.close(thisId)
    }
  }, [thisId])
}



export function App() {
  useDom("div", {
    style: `
    width:800px;
    height:800px;
    display:flex;
    align-items:center;
    justify-content:center;
    background-image: url(https://picsum.photos/id/1080/6858/4574), linear-gradient(rgb(219, 166, 166), rgb(0, 0, 172));
    background-position: center center;
    background-repeat: no-repeat;
    background-size: cover;
    position:relative;
    `,
    children() {
      useDom("div", {
        style: `
        width:200px;
        height:400px;
        border-radius:10px;
        position:relative;
        background:rgba(255,255,255,0.5);
        backdrop-filter: blur(10px);
        `,
        children() {
          renderContent("使用backdrop-filter")
        }
      })
      useDom("div", {
        style: `
        width:200px;
        height:400px;
        border-radius:10px;
        position:relative;
        background:rgba(255,255,255,0.5);
        &::before{
          content:"";
          position:absolute;
          inset:0 0 0 0;
          background:inherit;
          filter:blur(10px);
        }
        `,
        children() {
          renderContent("使用filter")
        }
      })
    }
  })

  useDom("div", {
    style: ` 
      width:100px;
      height:100px;
      border:4px solid aquamarine;
      background-color:#222;
      overflow:hidden;
      border-radius:50%;
      display:flex;
      justify-content:center;
      align-items:center;
      filter:blur(6px) contrast(6);

      @keyframes move{
        from {
          transform:translate(-100px);
        }
        to {
          transform:translate(100px)
        }
      }
    `,
    children() {
      useDom("div", {
        style: ` 
        width:1em;
        height:1em;
        transform:translate(0px,0px);
        background-color:aquamarine;
        animation: move 2s linear infinite;
        `
      })
    }
  })
}

function Demo() {
  useDom("div", {
    onClick() {
      console.log("点击")
    },
    style: `
      width: 100px;
      height: 100px;
      background-color: green;
    `,
    children() {
      useDom("div", {
        style: `
          width:20px;
          height:30px;
          background-color:green;
          `,
      })
    }
  })
  //MapList()
  //console.log("render--根")
  renderFragment(Count, [])
  useDom("div", {
    children() {

      renderContent("ccc内容")
      const [count, setCount] = useState(0)

      // renderIf(count % 2 == 0, () => {
      //   renderContent("这是偶数")
      //   renderContent("这是偶数1")
      //   renderContent("这是偶数2")
      //   renderContent("这是偶数3")
      // })

      renderGuard(count % 3,
        [
          v => v == 0,
          () => {
            renderContent("是0")
          }
        ],
        [
          v => v == 1,
          () => {
            renderContent("是1")
          }
        ]
      )

      useDom("div", {
        style: `
          background:yellow;
          `,
        children() {
          renderContent("这是内容")
          renderGuardString(count % 3 + 'vv', {
            '0vv'() {
              renderContent("022")
              renderContent("a322")
            },
            '2vv'() {

              renderContent("abcdefv")
            }
          })
        }
      })
      dom.button({
        onClick() {
          setCount(count + 1)
        },
        children() {
          renderContent("点击")
        }
      })
    }
  })
}

function Count() {
  console.log("render-count")
  const [count, setCount] = useState(9)
  dom.button({
    onClick(e) {
      setCount(v => v + 1)
      setCount(v => v + 1)
      e.stopPropagation()
    },
    children() {
      renderContent(`点击了${count}次`)
    }
  })
  dom.button({
    onClick(e) {
      e.stopPropagation()
      setCount(count)
    },
    textContent: "不点击呢"
  })
}
