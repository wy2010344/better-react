import { createUseReducer, renderAnimateExit } from "better-react-helper";
import { useTransitionValue } from "better-react-dom-helper";

import { dom } from "better-react-dom";
import { faker } from '@faker-js/faker';



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
    return {
      ...model,
      list: model.list.filter(v => v.id != action.id)
    }
  } else if (action.method == 'replace') {
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
  }
  return model
}, function (n: number) {
  return {
    id: 0,
    list: []
  }
})
export function renderTodoList() {
  dom.button({
    onClick() {
      dispatch({
        method: "append",
        value: faker.animal.rabbit()
      })
    }
  }).text`追加`
  const [model, dispatch] = useList(0)
  renderAnimateExit(model.list, {
    getKey(v) {
      return v.id
    },
    // mode: "wait",
    mode: "pop"
  }, function (v, arg) {
    const className = useTransitionValue(!arg.exiting, {
      beforeEnter: 'before-enter',
      enter: 'enter',
      leave: 'leave'
    })
    dom.div({
      className,
      style: `
      height:50px;
      display:flex;
      align-items:center;
      `,
      css: `
      transition:all ease 1s;
      &.before-enter{
        transform:translateX(100%);
      }
      &.enter{
        transform:translateX(0);
      }
      &.leave{
        transform:translateX(100%);
      }
      `,
      onTransitionEnd(event) {
        arg.resolve()
      },
    }).render(function () {
      dom.span().text`${v.id}---${v.value}`
      dom.button({
        onClick() {
          dispatch({
            method: "remove",
            id: v.id
          })
        }
      }).text`删除`
      dom.button({
        onClick() {
          dispatch({
            method: "replace",
            id: v.id,
            value: faker.animal.rabbit()
          })
        }
      }).text`替换`
    })
  })
}