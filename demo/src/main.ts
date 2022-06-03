import App from "./App";
import { render, useFragment, useGuard, useGuardString, useIf, useMap, useEffect, useMemo, useState } from "better-react";
import { useContent, useDom, scheduleAskTime, FiberNode, StyleContext } from "better-react-dom";
import dsl from "./dsl";
import { PanelCollection, PanelContext, PanelOperate } from "./panel/PanelContext";
import usePanel from "./panel/usePanel";
import { useStoreTriggerRender, ValueCenter } from "better-react-helper";
import { StylisCreater } from "stylis-creater";



const node = FiberNode.create(document.getElementById("app")!)
const destroy = render(
  function () {
    StyleContext.useProvider(StylisCreater)
    useDom("button", {
      onClick() {
        destroy()
      },
      children() {
        useContent("销毁所有")
      }
    })
    const { panels, operate } = useMemo(() => {
      const panels = ValueCenter.of<PanelCollection>([])
      let uid = 0
      const operate: PanelOperate = {
        push(callback) {
          const id = uid++
          const vs = panels.get()
          panels.set([...vs, { id, callback }])
          return id
        },
        close(id) {
          panels.set(panels.get().filter(v => v.id != id))
        },
        exist(id) {
          return !!panels.get().find(v => v.id == id)
        },
        moveToFirst(id) {
          const vs = panels.get()
          const oldIndex = vs.findIndex(v => v.id == id)
          if (oldIndex > -1) {
            const [old] = vs.splice(oldIndex, 1)
            panels.set([...vs, old])
          }
        }
      }
      return {
        panels,
        operate
      }
    }, [])
    PanelContext.useProvider(operate)
    useFragment(FirstPage)
    useFragment(RenderHost, panels)
  },
  node,
  //askTimeWork,
  //askIdleTimeWork,
  scheduleAskTime
);


function FirstPage() {
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
          TestButtonPage()
          useDom("button", {
            onClick(e) {
              e.stopPropagation()
              dsl(operate)
            },
            children() {
              useContent("进入DSL")
            }
          })
          Demo()

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
              TestButtonPage()
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



function RenderHost(panels: ValueCenter<PanelCollection>) {
  const vs = useStoreTriggerRender(panels)
  useMap(vs, v => v.id, v => v.callback(v.id))
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
  MapList()
  console.log("render--根")
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

function MapList() {

  const [list, setList] = useState<{
    index: number,
    key: string
  }[]>(() => [])
  useMap(list, v => v.index, (row, i) => {
    useDom("div", {
      children() {
        useDom("div", {
          children() {
            useContent(`我是内容${row.index}---${row.key}`)
          }
        })
        useDom("input", {})

        useDom("button", {
          onClick() {
            list.splice(i, 1)
            setList([...list])
            console.log(list, i)
          },
          children() {
            useContent("删除")
          }
        })
      }
    })
  })

  useDom("button", {
    onClick(e) {
      list.unshift({
        index: list.length,
        key: "vvv" + list.length
      })
      setList([...list])
      console.log(list)
      e.stopPropagation()
    },
    children() {
      useContent("增加列表")
    }
  })
}