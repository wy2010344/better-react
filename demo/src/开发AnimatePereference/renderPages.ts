import { EmptyFun, createContext } from "better-react";
import { createUseReducer, useRefFun, AnimateRow, renderAnimateExit, } from "better-react-helper";
import { useTransitionValue } from "better-react-dom-helper";
import { dom } from "better-react-dom";
import { faker } from "@faker-js/faker";
import { HookValueSet } from "better-react";
import { css } from "stylis-creater";





type Render = (v: AnimateRow<RenderPage>, className: string) => void
type AnimationType = "line" | "3d" | undefined
type RenderPage = {
  id: number
  render: Render
  animation: AnimationType
}
type PageAction = {
  method: "push" | "replace"
  render: Render
  animation?: "line" | "3d"
} | {
  method: "pop"
}
const usePages = createUseReducer(function (model: {
  method?: PageAction['method']
  id: number
  pages: RenderPage[]
  who: RenderPage
}, action: PageAction) {
  if (action.method == 'push') {
    const id = model.id + 1
    const pages = model.pages.slice()
    const who = {
      id,
      render: action.render,
      animation: action.animation
    }
    pages.push(who)
    return {
      method: action.method,
      id,
      pages,
      who
    }
  } else if (action.method == 'replace') {
    const id = model.id + 1
    const pages = model.pages.slice()
    pages.pop()
    const who = {
      id,
      render: action.render,
      animation: action.animation
    }
    pages.push(who)
    return {
      method: action.method,
      id,
      pages,
      who
    }

  } else if (action.method == 'pop') {
    if (model.pages.length == 1) {
      return model
    }
    const pages = model.pages.slice()
    const who = pages.pop()!
    return {
      ...model,
      method: action.method,
      pages,
      who: who
    }
  }
  return model
}, function (n: number) {
  const page = {
    id: 0,
    animation: undefined,
    render: renderPage
  }
  return {
    id: 0,
    pages: [
      page
    ],
    who: page
  }
})

const pageContext = createContext<{
  dispatch: HookValueSet<PageAction>
  size: number,
  method?: PageAction['method']
}>(null as any)
export function renderPages() {

  const [model, dispatch] = usePages(0)

  const method = model.method
  const animation = model.who.animation
  pageContext.useProvider({
    dispatch,
    size: model.pages.length,
    method: model.method
  })
  dom.div({
    style: `
    overflow:hidden;
    position:absolute;
    inset:0
    `
  }).render(function () {
    const page = model.pages.at(-1)!

    renderAnimateExit([page], {
      getKey(v) {
        return v.id
      },
      mode: animation == '3d' ? 'wait' : method == 'pop' ? 'pop' : 'shift',
      // onAnimateComplete() {
      //   if (method == 'pop') {
      //     //退回到第一页不对,因为使用3D的wait,退回到第一页,需要等第一页的入场动画完成
      //     dispatch({
      //       method: 'pop-animation',
      //       index: model.animations.length - 1
      //     })
      //   }
      // },
    }, function (v, arg) {
      const className = useTransitionValue(!arg.exiting,
        method
          ? method == 'pop'
            ? {
              beforeEnter: `ease-in left-enter`,
              enter: `ease-in enter`,
              beforeLeave: `ease-out enter`,
              leave: `ease-out right-leave`
            }
            : {
              beforeEnter: `ease-in right-enter`,
              enter: `ease-in enter`,
              beforeLeave: `ease-out enter`,
              leave: `ease-out left-leave`
            }
          : {
            beforeEnter: "",
            enter: "",
            leave: ""
          })
      v.render(arg, `${animation == '3d' ? baseCls3fName : baseClsName} ${className} `)
    })
  })
}

const baseClsName = css`
transition:all ease 1s;
&.left-enter{
  transform:translateX(-30%);
}
&.right-enter{
  transform:translateX(100%);
}
&.enter{
  transform:translateX(0);
}
&.left-leave{
  transform:translateX(-30%);
}
&.right-leave{
  transform:translateX(100%);
}
`

const baseCls3fName = css`
&.ease-in{
  transition:all ease-out 0.5s;
}
&.ease-out{
  transition:all ease-in 0.5s;
}
&.left-enter{
  transform:perspective(1000px) rotateY(-90deg);
}
&.right-enter{
  transform:perspective(1000px) rotateY(90deg);
}
&.enter{
  transform:perspective(1000px) rotateY(0deg);
}
&.left-leave{
  transform:perspective(1000px) rotateY(-90deg);
}
&.right-leave{
  transform:perspective(1000px) rotateY(90deg);
}
`

function renderPage(arg: AnimateRow<RenderPage>, className: string) {
  const { dispatch, size, method } = pageContext.useConsumer()
  const color = useRefFun(() => faker.color.rgb())
  dom.div({
    className,
    style: `
    position:absolute;
    inset:0;
    background:${color.get()};
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center
    `,
    onTransitionEnd(event) {
      arg.resolve()
    },
  }).render(function () {
    dom.span().text`页数${size} -- ${method || ''}`
    dom.button({
      onClick() {
        dispatch({
          method: "pop",
        })
      }
    }).text`退出`
    dom.button({
      onClick() {
        dispatch({
          method: "replace",
          render: renderPage
        })
      }
    }).text`替换`
    dom.button({
      onClick() {
        dispatch({
          method: "push",
          render: renderPage,
          animation: "3d"
        })
      }
    }).text`进入`

    dom.span().text`当前id${arg.key}`
  })
}