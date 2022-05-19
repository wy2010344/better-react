import { render, useGuard, useGuardString, useIf, useMap } from "./core";
import { FiberNode, StyleContext } from "./dom/updateDom";
import { ScheduleAskTime } from "./dom/schedule";
import { useContent, useDom } from "./dom";
import { useState } from "./core/fc";
import { StylisCreater } from "./stylis";


const node = FiberNode.create(document.getElementById("app")!)
const destroy = render(
  function () {
    StyleContext.useProvider(StylisCreater)
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
        Count()
      }
    })
    MapList()
    Count()

    useDom("div", {
      children() {
        useContent("内容")
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
  },
  node,
  //askTimeWork,
  //askIdleTimeWork,
  ScheduleAskTime
);

function Count() {
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
    onClick() {
      list.unshift({
        index: list.length,
        key: "vvv" + list.length
      })
      setList([...list])
      console.log(list)
    },
    children() {
      useContent("增加列表")
    }
  })
}