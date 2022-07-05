import { useEffect, useFragment, useGuard, useGuardString, useMap, useState } from "better-react";
import { useContent, useDom } from "better-react-dom";
import dsl from "./dsl";
import ExpensiveView from "./ExpensiveView";
import motionOne from "./motion-one";
import { CountContext, normalPanel, PanelContext } from "./panel/PanelContext";
import usePanel from "./panel/usePanel";
import dragDemo from "./test/dragDemo";
import todoList from "./todoList";
import vote from "./vote";


export default function FirstPage() {
  const operate = PanelContext.useConsumer()
  useEffect(() => {
    const id = operate.push(function () {
      usePanel({
        close() {
          console.log('v')
          operate.close(id)
        },
        children() {
          useContent("root")
          useFragment(TestButtonPage)
          useDom("button", {
            onClick(e) {
              e.stopPropagation()
              dsl(operate)
            },
            children() {
              useContent("进入DSL")
            }
          })
          useDom("button", {
            onClick(e) {
              e.stopPropagation()
              ExpensiveView(operate)
            },
            children() {
              useContent("进入ExpansiveView")
            }
          })
          useDom("button", {
            onClick(e) {
              e.stopPropagation()
              vote(operate)
            },
            children() {
              useContent("vote")
            }
          })
          useDom("button", {
            onClick(e) {
              e.stopPropagation()
              todoList(operate)
            },
            children() {
              useContent("todoList")
            }
          })
          useDom("button", {
            onClick(e) {
              e.stopPropagation()
              motionOne(operate)
            },
            children() {
              useContent("motion-one")
            }
          })
          Demo()

          //console.log("在这里")

          const value = CountContext.useConsumer()
          useContent(`在这里${value}`)


          useDom("button", {
            onClick(e) {
              e.stopPropagation()
              dragDemo(operate)
            },
            children() {
              useContent("drag-demo")
            }
          })
        },
        moveFirst() {
          operate.moveToFirst(id)
        }
      })
    })
    return () => {
      operate.close(id)
    }
  }, [])
}

function TestButtonPage() {
  const operate = PanelContext.useConsumer()
  const [thisId, setThisId] = useState(-1)
  console.log("renderId", thisId)
  useDom("button", {
    onClick(e) {
      e.stopPropagation()
      if (thisId < 0) {
        const id = operate.push(function () {
          usePanel({
            close() {
              operate.close(id)
            },
            children() {
              useFragment(TestButtonPage)
            },
            moveFirst() {
              operate.moveToFirst(id)
            }
          })
        })
        setThisId(id)
      }
    },
    children() {
      useContent("新弹窗")
    }
  })
  useEffect(() => {
    return () => {
      console.log("销毁了?", thisId)
      operate.close(thisId)
    }
  }, [thisId])
}



export function App() {
  useDom("div", {
    css: `
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
        css: `
        width:200px;
        height:400px;
        border-radius:10px;
        position:relative;
        background:rgba(255,255,255,0.5);
        backdrop-filter: blur(10px);
        `,
        children() {
          useContent("使用backdrop-filter")
        }
      })
      useDom("div", {
        css: `
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
          useContent("使用filter")
        }
      })
    }
  })

  useDom("div", {
    css: ` 
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
        css: ` 
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
    style: {
      width: "100px",
      height: "100px",
      backgroundColor: "green"
    },
    children() {
      useDom("div", {
        css: `
          width:20px;
          height:30px;
          background-color:green;
          `,
      })
    }
  })
  //MapList()
  //console.log("render--根")
  useFragment(Count)
  useDom("div", {
    children() {

      useContent("ccc内容")
      const [count, setCount] = useState(() => 0)

      // useIf(count % 2 == 0, () => {
      //   useContent("这是偶数")
      //   useContent("这是偶数1")
      //   useContent("这是偶数2")
      //   useContent("这是偶数3")
      // })

      useGuard(count % 3,
        [
          v => v == 0,
          () => {
            useContent("是0")
          }
        ],
        [
          v => v == 1,
          () => {
            useContent("是1")
          }
        ]
      )

      useDom("div", {
        css: `
          background:yellow;
          `,
        children() {
          useContent("这是内容")
          useGuardString(count % 3 + 'vv', {
            '0vv'() {
              useContent("022")
              useContent("a322")
            },
            '2vv'() {

              useContent("abcdefv")
            }
          })
        }
      })
      useDom("button", {
        onClick() {
          setCount(count + 1)
        },
        children() {
          useContent("点击")
        }
      })
    }
  })
}

function Count() {
  console.log("render-count")
  const [count, setCount] = useState(() => 9)
  useDom("button", {
    onClick(e) {
      setCount(count + 1)
      e.stopPropagation()
    },
    children() {
      useContent(`点击了${count}次`)
    }
  })
}
