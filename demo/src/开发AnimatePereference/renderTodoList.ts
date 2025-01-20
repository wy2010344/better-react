import { createUseReducer, renderKeyArray, useEffect, useEvent, useExitAnimate, useMemo, useVersion } from "better-react-helper";

import { dom } from "better-react-dom";
import { faker } from '@faker-js/faker';
import { cns, css } from "wy-dom-helper";
import { renderExitArrayClone, useTriggerStyleWithShow } from "better-react-dom-helper";
import { animate } from "motion";
import { emptyArray, emptyFun, ExitModel, getTimeoutPromise } from "wy-helper";
import { list } from "wy-helper/kanren";
const time = 500
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
  }).renderText`追加`
  const mode = version % 2 ? 'pop' : 'shift'
  dom.button({
    onClick() {
      updateVersion()
    }
  }).renderText`mode ${mode}`
  const v1 = version1 % 3
  const wait = v1 == 0 ? undefined : v1 == 2 ? 'in-out' : 'out-in'
  dom.button({
    onClick() {
      updateVersion1()
    }
  }).renderText`wait ${wait || ''}`
  const [model, dispatch] = useList(0)


  console.log("model", model.list)
  const mList = useExitAnimate(model.list, v => v.id, {
    // wait: "out-in"
    wait,
    mode,
    // enterIgnore(v: { id: number; }) {
    //   return v.id % 2 == 0
    // },
    // exitIgnore(v: { id: number; }) {
    //   return v.id % 3 == 0
    // },
    // onAnimateComplete() {
    //   console.log("动画完成")
    // },
    // onExitComplete() {
    //   console.log("退出完成")
    // },
    // onEnterComplete() {
    //   console.log("进入完成")
    // }
  })
  console.log("list", mList)
  // renderKeyArray(
  //   mList,
  //   function (v) {
  //     console.log("ddd", v.step)
  //     // const waitFinish = getTimeoutPromise(time, v.resolve)
  //     // const { className } = useTriggerStyleWithShow(
  //     //   () => node,
  //     //   v.exiting,
  //     //   {
  //     //     from: {
  //     //       className: 'before-enter'
  //     //     },
  //     //     target: {
  //     //       className: 'enter',
  //     //     },
  //     //     waitFinish
  //     //   },
  //     //   {
  //     //     target: {
  //     //       className: "leave"
  //     //     },
  //     //     waitFinish
  //     //   })
  //     const node = renderRow(v, dispatch)
  //     // console.log("ini", v,)
  //     const exiting = v.step == 'exiting'
  //     useEffect(() => {
  //       animate(node, {
  //         x: exiting ? '100%' : ['100%', 0]
  //       }).then(v.resolve)
  //     }, [exiting])
  //   })

  renderExitArrayClone(mList, function (v, i) {
    const node = renderRow(v, dispatch)
    useEffect(() => {
      animate(node as HTMLElement, {
        x: ['100%', 0]
      }).then(v.resolve)
    }, emptyArray)
    return {
      node,
      value: v,
      applyAnimate(node, v) {
        animate(node as HTMLElement, {
          x: '100%'
        }).then(v.resolve)
      },
    }
  })
}

function renderRow(v: ExitModel<{
  id: number;
  value: string;
}>, dispatch: any) {

  const [version, updateVersion] = useVersion()
  const opacity = useMemo(() => {
    return 1// Math.random()
  }, [version])
  const node: HTMLDivElement = dom.div({
    className: cns(rowClsName),
    style: `
      height:50px;
      display:flex;
      align-items:center;
      opacity:${opacity};
      `,
    // onTransitionEnd: resolve,
  }).render(function () {
    dom.span().renderText`${v.value.id}---${v.value.value}`
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
    }).renderText`删除`
    dom.button({
      onClick() {
        dispatch({
          method: "replace",
          id: v.value.id,
          value: faker.animal.rabbit()
        })
      }
    }).renderText`替换`
    dom.button({
      onClick() {
        updateVersion()
      }
    }).renderText`抖动`
  })
  return node
}

const rowClsName = css`
/* transition:all ease ${time}ms; */
&.before-enter{
  transform:translateX(100%);
}
&.enter{
  transform:translateX(0);
}
&.leave{
  transform:translateX(-100%);
}
`