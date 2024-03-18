import { createContext, hookFlushSync } from "better-react";
import { createUseReducer, renderExitAnimateArray, useAtomFun, useRenderExitAnimate, useTimeoutAnimateValue } from "better-react-helper";
import { dom } from "better-react-dom";
import { faker } from "@faker-js/faker";
import { ExitModel, SetValue, objectDeepEqual } from "wy-helper";
import { css } from "wy-dom-helper";
import { useTriggerStyleWithShow } from "better-react-dom-helper";
import { getTimeoutPromise } from "better-react-dom-helper";


const time = 500


type Render = (v: ExitModel<RenderPage>, className: string) => HTMLElement
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
  dispatch: SetValue<PageAction>
  size: number,
  method?: PageAction['method']
}>(null as any)
export function renderPages() {
  const n = window as any
  n.objectDe = objectDeepEqual

  const [model, dispatch] = usePages(0)

  const method = model.method
  const animation = model.who.animation
  pageContext.hookProvider({
    dispatch,
    size: model.pages.length,
    method: model.method
  })

  const page = model.pages.at(-1)!
  const config = method == 'pop' ? {
    init: "left",
    enter: 'center animation',
    show: 'center',
    exit: 'right animation'
  } : {
    init: "right",
    enter: 'center animation',
    show: 'center',
    exit: 'left animation'
  }
  const balseClsName = animation == '3d' ? baseCls3fName : baseClsName

  dom.div({
    style: `
    position:relative;
    width:300px;
    height:200px;
    `
  }).render(function () {
    renderExitAnimateArray(
      useRenderExitAnimate(
        [page], v => v.id, {
        mode: method == 'pop' ? 'pop' : 'shift',
        // wait: "out-in"
      }), function (v) {
        const waitFinish = getTimeoutPromise(time, function () {
          console.log("destroy", v.originalKey, v.exiting)
          v.resolve()
        })
        const { className } = useTriggerStyleWithShow(() => node, v.exiting, {
          from: {
            className: config.init
          },
          target: {
            className: config.enter
          },
          waitFinish
        }, {
          force: true,
          target: {
            className: config.exit
          },
          waitFinish
        })
        const node = v.value.render(v, `${balseClsName} ${method && className} `)
      })
  })
  // dom.div({
  //   style: `
  //   position:relative;
  //   width:300px;
  //   height:200px;
  //   `
  // }).render(function () {
  //   renderExitAnimate([page], v => v.id, {
  //     mode: method == 'pop' ? 'pop' : 'shift',
  //   }, function (v) {
  //     const state = useLifeStateTransition(v.exiting, {
  //       resolve: v.resolve,
  //       ref() {
  //         return node
  //       },
  //     })
  //     const node = v.value.render(v, `${balseClsName} ${method && getLifeState(config, state)} `)
  //   })
  // })
  // dom.div({
  //   style: `
  //   position:relative;
  //   width:300px;
  //   height:200px;
  //   // overflow:hidden;
  //   `
  // }).render(function () {
  //   renderExitAnimate([page], v => v.id, {
  //     mode: method == 'pop' ? 'pop' : 'shift',
  //   }, function (v) {
  //     /**
  //      * 主要是enter有动画参数,切换到退出,是平滑过去的
  //      * 不像上面有个中间状态,则不会平滑过渡:立即切换为退出状态.
  //      * 因为在进入中立即变成退出中,进入中的resolve,而退出中的是否立即resolve呢?
  //      */
  //     useInitClassNames(() => node, config.init || '', config.enter || '')
  //     useBindTransitionFinish(() => node, v.resolve, [!v.exiting])
  //     const node = v.value.render(v, `${balseClsName} ${v.exiting ? config.exit : config.enter}`)
  //   })
  // })
  // dom.div({
  //   style: `
  //   position:relative;
  //   width:300px;
  //   height:200px;
  //   // overflow:hidden;
  //   `
  // }).render(function () {
  //   renderExitAnimate([page], v => v.id, {
  //     mode: method == 'pop' ? 'pop' : 'shift',
  //   }, function (v) {
  //     /**
  //      * 为什么这种方式会比上面慢一格? 是因为颜色也发生了动画,而颜色的动画触发提前结束
  //      * 而且进入时,颜色也发生的渐变.
  //      * 如果不设className,只做scrollTop,也不能触发动画
  //      */
  //     useLevelEffect(-1, () => {
  //       node.className = `${balseClsName} ${config.init}`
  //       node.scrollTop
  //     }, emptyArray)
  //     useBindTransitionFinish(() => node, v.resolve, [!v.exiting])
  //     const node = v.value.render(v, `${balseClsName} ${v.exiting ? config.exit : config.enter}`)
  //   })
  // })
  dom.button({
    onClick() {
      dispatch({
        method: "replace",
        render: renderPage
      })
    }
  }).renderText`替换`
}

const baseClsName = css`
&.center{
  transform:translateX(0);
}
&.left{
  transform:translateX(-100%);
}
&.right{
  transform:translateX(100%);
}
&.animation{
  transition:transform linear ${time}ms;
}
`

const baseCls3fName = css`
backface-visibility: hidden;
&.enter{
  transform:perspective(1000px) rotateY(0deg);
}
&.left{
  transform:perspective(1000px) rotateY(-180deg);
}
&.right{
  transform:perspective(1000px) rotateY(180deg);
}
&.animation{
  transition:transform linear ${time}ms;
}
`

function renderPage(arg: ExitModel<RenderPage>, className: string) {
  const { dispatch, size, method } = pageContext.useConsumer()
  const color = useAtomFun(() => {
    faker.seed(arg.key)
    return faker.color.rgb()
  })
  return dom.div({
    className,
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
    // onTransitionEnd(event) {
    //   if (arg.exiting) {
    //     arg.resolve()
    //   }
    // },
  }).render(function () {
    dom.span().renderText`页数${size} -- ${method || ''}`
    dom.button({
      onClick() {
        dispatch({
          method: "pop",
        })
      }
    }).renderText`退出`
    const flushSync = hookFlushSync()
    dom.button({
      onClick() {
        flushSync(function () {
          dispatch({
            method: "replace",
            render: renderPage
          })
        })
      }
    }).renderText`替换`
    dom.button({
      onClick() {
        dispatch({
          method: "replace",
          render: renderPage
        })
      }
    }).renderText`替换`
    dom.button({
      onClick() {
        dispatch({
          method: "push",
          render: renderPage,
          animation: "3d"
        })
      }
    }).renderText`进入`

    dom.span().renderText`当前id${arg.originalKey}`
  })
}

let count = 1