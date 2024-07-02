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
    return arrayMove(list, action.index, action.toIndex, true)
  }
  return list
}


const testContext = createContext(9)

export default function () {
  dom.div().render(function () {

    testContext.hookProvider(99)
    const [list, dispatch] = useReducer(reduceList, emptyArray as Row[])

    renderArray(list, v => {
      console.log("dvv", v)
      return v.index
    }, function (row: Row, i: number) {
      dom.div().renderText`${row.index}--${row.value}`

      const [version, updateVersion] = useVersion()


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
          dispatch({
            type: "move",
            index: i,
            toIndex: i - 1
          })
        },
      }).renderText`上移`
      dom.button({
        onClick(event) {
          dispatch({
            type: "move",
            index: i,
            toIndex: i + 1
          })
        },
      }).renderText`下移`

      const v1 = testContext.useConsumer()
      dom.button().renderText`ddd${v1}`

      renderFragment(() => {
        const [version, updateVersion] = useVersion()


        useEffect((e) => {
          console.log('init', e)
          return function (e) {
            console.log('destroy', e)
          }
        }, [version])
        dom.button({
          onClick: updateVersion
        }).renderText`${row.index}--${version}`
      }, emptyArray)
    })

    testContext.hookProvider(33)
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


    dom.br().render()
    const v1 = testContext.useConsumer()
    dom.button().renderText`ddd${v1}`
  })
}