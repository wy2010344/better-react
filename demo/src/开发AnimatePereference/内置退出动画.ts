import { createContext, emptyArray, useGetFlushSync } from "better-react";
import { createUseReducer, useAtomFun, renderExitAnimate, ExitModel, renderOne, delay, useEffect, useEvent, useChange, } from "better-react-helper";
import { cns, css, requestAnimationState, useLifeTransSameTime } from "better-react-dom-helper";
import { dom } from "better-react-dom";
import { faker } from "@faker-js/faker";
import { HookValueSet } from "better-react";




type Render = (className: string, config: {
  from: string
  show: string
  exit: string
}, getExitClassName: () => string) => void
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
export default function renderPages() {

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
    const config = method == 'pop' ? {
      from: 'left',
      show: 'center',
      exit: 'right'
    } : {
      from: 'right',
      show: 'center',
      exit: 'left'
    }
    const balseClsName = animation == '3d' ? base3DClsName : baseTransClsName

    const getExitClassName = useEvent(() => {
      return cns(balseClsName, config.exit)
    })
    renderOne(page.id, function () {
      page.render(balseClsName, config, getExitClassName)
    })
  })
}


const baseTransClsName = css`
transition:all ease 1s;
&.left{
  transform:translateX(-100%);
}
&.right{
  transform:translateX(100%);
}
&.center{
  transform:translateX(0);
  transform:perspective(1000px) rotateY(0deg);
}
`

const base3DClsName = css`
transition:all linear 1s;
backface-visibility: hidden;
&.left{
  transform:perspective(1000px) rotateY(-180deg);
}
&.enter{
  transform:translateX(0);
  transform:perspective(1000px) rotateY(0deg);
}
&.right{
  transform:perspective(1000px) rotateY(180deg);
}
`

function renderPage(baseClassName: string, config: {
  from: string
  show: string
  exit: string
}, getExitClassName: () => string) {
  const { dispatch, size, method } = pageContext.useConsumer()
  const color = useAtomFun(() => faker.color.rgb())
  const flushSync = useGetFlushSync()

  const [showCls, setShowCls] = useChange(config.from)
  useEffect(() => {
    requestAnimationState(() => {
      flushSync(function () {
        setShowCls(config.show)
      })
    })
  }, emptyArray)
  dom.div({
    className: cns(baseClassName, showCls),
    style: `
    position:absolute;
    inset:0;
    background:${color.get()};
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    opacity:0.9;
    `,
    exit(node) {
      //为什么这里仍然不行?如果使用useEffect,则在effect里面触发.
      requestAnimationState(() => {
        node.className = getExitClassName()
      })
      return delay(1000)
    },
    // onTransitionEnd(event) {
    //   if (arg.exiting) {
    //     arg.resolve()
    //   }
    // },
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
        flushSync(function () {
          dispatch({
            method: "replace",
            render: renderPage
          })
        })
      }
    }).text`替换`
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
  })
}