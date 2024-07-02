import { faker } from "@faker-js/faker";
import { createContext } from "better-react";
import { dom } from "better-react-dom";
import { renderArray, renderFragment, useEffect, useReducer, useVersion } from "better-react-helper";
import { Reducer, arrayMove, emptyArray } from "wy-helper";

type Row = {
  index: number,
  value: string
}
let globalIdx = 0
const reduceList: Reducer<Row[], {
  type: "insert"
  index: number,
  value: Row
} | {
  type: "remove",
  index: number
} | {
  type: "move"
  index: number
  toIndex: number
}> = (list, action) => {
  if (action.type == "insert") {
    list = list.slice()
    list.splice(action.index, 0, action.value)
    return list
  } else if (action.type == "remove") {
    list = list.slice()
    list.splice(action.index, 1)
    return list
  } else if (action.type == "move") {
    const nList = arrayMove(list, action.index, action.toIndex, true)
    const w = window as any
    w.arrayMove = arrayMove
    console.log("ssvv", list, nList, action.index, action.toIndex)
    return nList
  }
  return list
}


const testContext = createContext({
  value: 0,
  updateVersion() { }
})

export default function renderTodo() {
  dom.div().render(function () {

    const [version, updateVersion] = useVersion()
    testContext.useProvider({
      value: version,
      updateVersion
    })
    const [list, dispatch] = useReducer(reduceList, emptyArray as Row[])
    console.log("list--", list, list.length)
    renderArray(list, v => {
      return v.index
    }, function (row: Row, i: number) {
      console.log("render...")
      dom.div().renderText`${row.index}--${row.value}`

      // dom.div({
      //   style: `
      //   padding:10px;
      //   `
      // }).render(() => {
      //   // renderTodo()
      // })
      const [version, updateVersion] = useVersion()

      // testContext.hookProvider({
      //   value: version,
      //   updateVersion
      // })
      useEffect(() => {
        console.log("初始化", row)
        return () => {
          console.log("销毁", row)
        }
      }, emptyArray)

      dom.button({
        onClick(event) {
          updateVersion()
        },
      }).renderText`增加${version}`

      dom.button({
        onClick(event) {
          dispatch({
            type: "insert",
            index: i + 1,
            value: {
              index: globalIdx++,
              value: faker.person.fullName()
            }
          })
        },
      }).renderText`添加`
      dom.button({
        onClick(event) {
          dispatch({
            type: "remove",
            index: i
          })
        },
      }).renderText`删除`
      dom.button({
        onClick(event) {
          const toI = i - 1
          dispatch({
            type: "move",
            index: i,
            toIndex: toI < 0 ? list.length - 1 : toI
          })
        },
      }).renderText`上移`
      dom.button({
        onClick(event) {
          const toI = i + 1
          dispatch({
            type: "move",
            index: i,
            toIndex: toI > list.length - 1 ? 0 : toI
          })
        },
      }).renderText`下移`

      // const v1 = testContext.useConsumer()
      // dom.button().renderText`ddxxxxd${v1.value}`

      renderFragment(() => {
        const v1 = testContext.useConsumer()
        useEffect((e) => {
          console.log('init', e)
          return function (e) {
            console.log('destroy', e)
          }
        }, [version])
        dom.button({
          onClick: v1.updateVersion
        }).renderText`${row.index}--${v1.value}`
      }, emptyArray)
    })
    dom.button({
      onClick(event) {
        dispatch({
          type: "insert",
          index: 0,
          value: {
            index: globalIdx++,
            value: faker.person.fullName()
          }
        })
      },
    }).renderText`添加`


    console.log("afterRender", list)
    const [v2, upV2] = useVersion()
    testContext.useProvider({
      value: v2,
      updateVersion: upV2
    })
    dom.br().render()
    // const v1 = testContext.useConsumer()
    dom.button().renderText`ddd${v2}`
  })
}


