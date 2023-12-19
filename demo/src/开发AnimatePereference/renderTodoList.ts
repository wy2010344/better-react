import { createUseReducer, renderExitAnimate, useMemo, useVersion } from "better-react-helper";
import { css, getLifeState, useLifeState, useLifeStateTime, useLifeStateTransition } from "better-react-dom-helper";

import { dom } from "better-react-dom";
import { faker } from '@faker-js/faker';
import { cns } from "better-react-dom-helper";
import { emptyFun } from "better-react";

const time = 5000
const removeList: number[] = []
const useList = createUseReducer(function (model: {
  list: {
    id: number
    value: string
  }[]
  id: number
}, action: {
  method: "append",
  value: string
} | {
  method: "remove"
  id: number
} | {
  method: "replace"
  id: number
  value: string
} | {
  method: 'reuse'
  value: string
}) {
  if (action.method == 'append') {
    const newId = model.id + 1
    return {
      id: newId,
      list: model.list.concat({
        id: newId,
        value: action.value
      })
    }
  } else if (action.method == 'remove') {
    removeList.push(action.id)
    return {
      ...model,
      list: model.list.filter(v => v.id != action.id)
    }
  } else if (action.method == 'replace') {
    // return {
    //   ...model,
    //   list: model.list.map(row => {
    //     if (row.id == action.id) {
    //       return {
    //         id: row.id,
    //         value: action.value
    //       }
    //     }
    //     return row
    //   })
    // }
    const newId = model.id + 1
    return {
      id: newId,
      list: model.list.map(row => {
        if (row.id == action.id) {
          return {
            id: newId,
            value: action.value
          }
        }
        return row
      })
    }
  } else if (action.method == 'reuse') {
    const list = model.list.slice()
    list.push({
      id: removeList.shift()!,
      value: action.value
    })
    return {
      ...model,
      list
    }
  }
  return model
}, function (n: number) {
  return {
    id: 0,
    list: []
  }
})
export function renderTodoList() {
  const [version, updateVersion] = useVersion()
  const [version1, updateVersion1] = useVersion()
  dom.button({
    onClick() {
      dispatch({
        method: "append",
        value: faker.animal.rabbit()
      })
    }
  }).text`追加`
  const mode = version % 2 ? 'pop' : 'shift'
  dom.button({
    onClick() {
      updateVersion()
    }
  }).text`mode ${mode}`
  const v1 = version1 % 3
  const wait = v1 == 0 ? undefined : v1 == 2 ? 'in-out' : 'out-in'
  dom.button({
    onClick() {
      updateVersion1()
    }
  }).text`wait ${wait || ''}`
  const [model, dispatch] = useList(0)


  renderExitAnimate(model.list, v => v.id, {
    wait,
    mode,
    // enterIgnore(v) {
    //   return v.id % 2 == 0
    // },
    // exitIgnore(v) {
    //   return v.id % 3 == 0
    // },
    onAnimateComplete() {
      console.log("动画完成")
    },
    onExitComplete() {
      console.log("退出完成")
    },
    onEnterComplete() {
      console.log("进入完成")
    }
  }, function (v) {
    const state = useLifeStateTime(v.exiting, time, {
      ref() {
        return node!
      },

      resolve: v.resolve,
      disabled: v.enterIgnore
    })
    const [version, updateVersion] = useVersion()
    const opacity = useMemo(() => {
      return 1// Math.random()
    }, [version])
    const node = dom.div({
      className: cns(getLifeState({
        init: 'before-enter',
        enter: 'enter',
        exit: 'leave'
      }, state), rowClsName),
      style: `
      height:50px;
      display:flex;
      align-items:center;
      opacity:${opacity};
      `,
      // onTransitionEnd: resolve,
    }).render(function () {
      dom.span().text`${v.value.id}---${v.value.value}`
      dom.button({
        onClick() {
          dispatch({
            method: "remove",
            id: v.value.id
          })

          // setTimeout(() => {
          //   dispatch({
          //     method: "reuse",
          //     value: faker.animal.rabbit()
          //   })
          // }, 1000)
        }
      }).text`删除`
      dom.button({
        onClick() {
          dispatch({
            method: "replace",
            id: v.value.id,
            value: faker.animal.rabbit()
          })
        }
      }).text`替换`
      dom.button({
        onClick() {
          updateVersion()
        }
      }).text`抖动`
    })
  })
}

const rowClsName = css`
transition:all ease ${time}ms;
&.before-enter{
  transform:translateX(100%);
}
&.enter{
  transform:translateX(0);
}
&.leave{
  transform:translateX(100%);
}
`